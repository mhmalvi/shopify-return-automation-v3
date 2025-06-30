import Stripe from "stripe"
import { createServerClient } from "./supabase"
import type { Merchant } from "./types"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-05-28.basil",
})

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: "month" | "year"
  features: string[]
  returnLimit: number
}

export interface UsageRecord {
  merchantId: string
  usage: number
  timestamp: Date
}

export class BillingService {
  private static instance: BillingService
  private supabase = createServerClient()

  public static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService()
    }
    return BillingService.instance
  }

  private plans: SubscriptionPlan[] = [
    {
      id: "starter",
      name: "Starter",
      price: 29,
      interval: "month",
      features: ["Up to 100 returns/month", "AI suggestions", "Basic analytics", "Email support"],
      returnLimit: 100,
    },
    {
      id: "growth",
      name: "Growth",
      price: 79,
      interval: "month",
      features: ["Up to 500 returns/month", "Advanced AI", "Full analytics", "Priority support", "Custom branding"],
      returnLimit: 500,
    },
    {
      id: "pro",
      name: "Pro",
      price: 149,
      interval: "month",
      features: ["Unlimited returns", "AI + ML insights", "Advanced reporting", "Dedicated support", "API access"],
      returnLimit: -1, // Unlimited
    },
  ]

  async createCustomer(merchant: Merchant): Promise<string | null> {
    try {
      const customer = await stripe.customers.create({
        email: `admin@${merchant.shop_domain}`,
        name: merchant.shop_domain,
        metadata: {
          merchant_id: merchant.id,
          shop_domain: merchant.shop_domain,
        },
      })

      // Update merchant record with Stripe customer ID
      await this.supabase.from("merchants").update({ stripe_customer_id: customer.id }).eq("id", merchant.id)

      return customer.id
    } catch (error) {
      console.error("Failed to create Stripe customer:", error)
      return null
    }
  }

  async createSubscription(merchantId: string, planId: string): Promise<any> {
    try {
      // Get merchant data
      const { data: merchant } = await this.supabase.from("merchants").select("*").eq("id", merchantId).single()

      if (!merchant) {
        throw new Error("Merchant not found")
      }

      // Create customer if doesn't exist
      let customerId = merchant.stripe_customer_id
      if (!customerId) {
        customerId = await this.createCustomer(merchant)
        if (!customerId) {
          throw new Error("Failed to create customer")
        }
      }

      // Get plan details
      const plan = this.plans.find((p) => p.id === planId)
      if (!plan) {
        throw new Error("Invalid plan")
      }

      // Create Stripe price if it doesn't exist
      const priceId = await this.getOrCreatePrice(plan)

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      })

      // Update billing record with correct property access using snake_case
      await this.supabase.from("billing_records").upsert({
        merchant_id: merchantId,
        plan_type: planId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        usage_count: 0,
      })

      return {
        subscription_id: subscription.id,
        client_secret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        status: subscription.status,
      }
    } catch (error) {
      console.error("Failed to create subscription:", error)
      throw error
    }
  }

  async updateUsage(merchantId: string, additionalUsage = 1): Promise<boolean> {
    try {
      // Get current billing record
      const { data: billing } = await this.supabase
        .from("billing_records")
        .select("*")
        .eq("merchant_id", merchantId)
        .single()

      if (!billing) {
        console.error("No billing record found for merchant:", merchantId)
        return false
      }

      const newUsage = billing.usage_count + additionalUsage
      const plan = this.plans.find((p) => p.id === billing.plan_type)

      // Check if usage exceeds plan limit
      if (plan && plan.returnLimit > 0 && newUsage > plan.returnLimit) {
        console.warn(`Usage limit exceeded for merchant ${merchantId}: ${newUsage}/${plan.returnLimit}`)
        // Could trigger upgrade notification here
      }

      // Update usage count
      await this.supabase
        .from("billing_records")
        .update({
          usage_count: newUsage,
          updated_at: new Date().toISOString(),
        })
        .eq("merchant_id", merchantId)

      return true
    } catch (error) {
      console.error("Failed to update usage:", error)
      return false
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case "invoice.payment_succeeded":
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case "invoice.payment_failed":
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
          break

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (error) {
      console.error("Webhook handling error:", error)
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string

    // Find merchant by customer ID
    const { data: merchant } = await this.supabase
      .from("merchants")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single()

    if (merchant) {
      await this.supabase
        .from("billing_records")
        .update({
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("merchant_id", merchant.id)
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const customerId = subscription.customer as string

    const { data: merchant } = await this.supabase
      .from("merchants")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single()

    if (merchant) {
      // Downgrade to free plan or suspend account
      await this.supabase.from("merchants").update({ plan_type: "starter" }).eq("id", merchant.id)
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    // Reset usage count for new billing period
    const customerId = invoice.customer as string

    const { data: merchant } = await this.supabase
      .from("merchants")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single()

    if (merchant) {
      await this.supabase
        .from("billing_records")
        .update({
          usage_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("merchant_id", merchant.id)
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Handle failed payment - could send notification, suspend account, etc.
    console.log("Payment failed for invoice:", invoice.id)
  }

  private async getOrCreatePrice(plan: SubscriptionPlan): Promise<string> {
    // In a real app, you'd store price IDs in your database
    // For now, return mock price IDs
    const priceIds = {
      starter: "price_starter_monthly",
      growth: "price_growth_monthly",
      pro: "price_pro_monthly",
    }

    return priceIds[plan.id as keyof typeof priceIds] || "price_default"
  }

  getPlan(planId: string): SubscriptionPlan | undefined {
    return this.plans.find((p) => p.id === planId)
  }

  getAllPlans(): SubscriptionPlan[] {
    return this.plans
  }
}

export const billingService = BillingService.getInstance()
