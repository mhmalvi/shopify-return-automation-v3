import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { verifyShopifyWebhook } from "@/lib/shopify-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-shopify-hmac-sha256")
    const topic = request.headers.get("x-shopify-topic")
    const shopDomain = request.headers.get("x-shopify-shop-domain")

    if (!signature || !topic || !shopDomain) {
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET
    if (!webhookSecret || !verifyShopifyWebhook(body, signature, webhookSecret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const data = JSON.parse(body)
    const supabase = createServerClient()

    // Get merchant
    const { data: merchant } = await supabase.from("merchants").select("id").eq("shop_domain", shopDomain).single()

    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    // Handle different webhook topics
    switch (topic) {
      case "orders/updated":
        await handleOrderUpdated(data, merchant.id, supabase)
        break

      case "orders/cancelled":
        await handleOrderCancelled(data, merchant.id, supabase)
        break

      case "refunds/create":
        await handleRefundCreated(data, merchant.id, supabase)
        break

      default:
        console.log(`Unhandled webhook topic: ${topic}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleOrderUpdated(orderData: any, merchantId: string, supabase: any) {
  // Update any related returns if order status changes
  const { data: returns } = await supabase
    .from("returns")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("shopify_order_id", orderData.id.toString())

  if (returns && returns.length > 0) {
    // Log analytics event
    await supabase.from("analytics_events").insert({
      merchant_id: merchantId,
      event_type: "order_updated",
      event_data: {
        order_id: orderData.id,
        financial_status: orderData.financial_status,
        fulfillment_status: orderData.fulfillment_status,
      },
    })
  }
}

async function handleOrderCancelled(orderData: any, merchantId: string, supabase: any) {
  // Update related returns to cancelled status
  await supabase
    .from("returns")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("merchant_id", merchantId)
    .eq("shopify_order_id", orderData.id.toString())
    .eq("status", "requested")

  // Log analytics event
  await supabase.from("analytics_events").insert({
    merchant_id: merchantId,
    event_type: "order_cancelled",
    event_data: {
      order_id: orderData.id,
      cancelled_at: orderData.cancelled_at,
    },
  })
}

async function handleRefundCreated(refundData: any, merchantId: string, supabase: any) {
  // Update return status if refund was processed
  const { data: returns } = await supabase
    .from("returns")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("shopify_order_id", refundData.order_id.toString())
    .eq("status", "approved")

  if (returns && returns.length > 0) {
    await supabase
      .from("returns")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .in(
        "id",
        returns.map((r) => r.id),
      )

    // Log analytics event
    await supabase.from("analytics_events").insert({
      merchant_id: merchantId,
      event_type: "refund_processed",
      event_data: {
        refund_id: refundData.id,
        order_id: refundData.order_id,
        amount: refundData.amount,
        return_ids: returns.map((r) => r.id),
      },
    })
  }
}
