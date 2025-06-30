import { Resend } from "resend"
import type { Return, Merchant } from "./types"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  from?: string
}

interface MerchantSettings {
  brand_color?: string
  logo_url?: string
  return_policy?: string
  notification_email?: string
}

export class EmailService {
  private static instance: EmailService
  private fromEmail = process.env.FROM_EMAIL || "noreply@returnsautomation.com"

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendReturnConfirmation(returnData: Return, merchant: Merchant): Promise<boolean> {
    try {
      const template = this.generateReturnConfirmationTemplate(returnData, merchant)

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: returnData.customer_email,
        subject: `Return Request Confirmed - Order #${returnData.shopify_order_id}`,
        html: template,
      })

      if (error) {
        console.error("Email send error:", error)
        return false
      }

      console.log("Return confirmation email sent:", data?.id)
      return true
    } catch (error) {
      console.error("Failed to send return confirmation:", error)
      return false
    }
  }

  async sendMerchantNotification(returnData: Return, merchant: Merchant): Promise<boolean> {
    try {
      const template = this.generateMerchantNotificationTemplate(returnData, merchant)
      const settings = merchant.settings as MerchantSettings

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: settings.notification_email || "admin@" + merchant.shop_domain,
        subject: `New Return Request - Order #${returnData.shopify_order_id}`,
        html: template,
      })

      if (error) {
        console.error("Merchant notification error:", error)
        return false
      }

      console.log("Merchant notification sent:", data?.id)
      return true
    } catch (error) {
      console.error("Failed to send merchant notification:", error)
      return false
    }
  }

  async sendStatusUpdate(returnData: Return, merchant: Merchant, newStatus: string): Promise<boolean> {
    try {
      const template = this.generateStatusUpdateTemplate(returnData, merchant, newStatus)

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: returnData.customer_email,
        subject: `Return Update - Order #${returnData.shopify_order_id}`,
        html: template,
      })

      if (error) {
        console.error("Status update email error:", error)
        return false
      }

      console.log("Status update email sent:", data?.id)
      return true
    } catch (error) {
      console.error("Failed to send status update:", error)
      return false
    }
  }

  async sendShippingLabel(returnData: Return, merchant: Merchant, labelUrl: string): Promise<boolean> {
    try {
      const template = this.generateShippingLabelTemplate(returnData, merchant, labelUrl)

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: returnData.customer_email,
        subject: `Return Shipping Label - Order #${returnData.shopify_order_id}`,
        html: template,
        attachments: [
          {
            filename: `return-label-${returnData.id}.pdf`,
            content: labelUrl, // In real implementation, fetch and attach PDF
          },
        ],
      })

      if (error) {
        console.error("Shipping label email error:", error)
        return false
      }

      console.log("Shipping label email sent:", data?.id)
      return true
    } catch (error) {
      console.error("Failed to send shipping label:", error)
      return false
    }
  }

  private generateReturnConfirmationTemplate(returnData: Return, merchant: Merchant): string {
    const settings = merchant.settings as MerchantSettings
    const brandColor = settings.brand_color || "#1D4ED8"
    const logoUrl = settings.logo_url || ""

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Return Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Store Logo" style="max-height: 60px; margin-bottom: 20px;">` : ""}
            <h1 style="color: ${brandColor}; margin: 0;">Return Request Confirmed</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Return Details</h2>
            <p><strong>Order Number:</strong> #${returnData.shopify_order_id}</p>
            <p><strong>Return ID:</strong> ${returnData.id}</p>
            <p><strong>Reason:</strong> ${returnData.reason}</p>
            <p><strong>Status:</strong> <span style="color: ${brandColor}; font-weight: bold;">${returnData.status.toUpperCase()}</span></p>
            <p><strong>Amount:</strong> $${returnData.total_amount}</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3>What happens next?</h3>
            <ol style="padding-left: 20px;">
              <li>We'll review your return request within 24 hours</li>
              <li>You'll receive an email with return shipping instructions</li>
              <li>Pack your item(s) securely and ship them back to us</li>
              <li>We'll process your return within 3-5 business days after receiving your item(s)</li>
            </ol>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Questions?</strong> Contact us at support@${merchant.shop_domain}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>Thank you for shopping with ${merchant.shop_domain}</p>
          </div>
        </body>
      </html>
    `
  }

  private generateMerchantNotificationTemplate(returnData: Return, merchant: Merchant): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Return Request</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">New Return Request</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0;">Return Details</h2>
            <p><strong>Customer:</strong> ${returnData.customer_email}</p>
            <p><strong>Order:</strong> #${returnData.shopify_order_id}</p>
            <p><strong>Reason:</strong> ${returnData.reason}</p>
            <p><strong>Amount:</strong> $${returnData.total_amount}</p>
            <p><strong>Submitted:</strong> ${new Date(returnData.created_at).toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
               style="background: #1D4ED8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Return Request
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This return request requires your attention. Please review and approve/reject within 24 hours.
          </p>
        </body>
      </html>
    `
  }

  private generateStatusUpdateTemplate(returnData: Return, merchant: Merchant, newStatus: string): string {
    const statusMessages = {
      approved: "Your return has been approved! We'll send you shipping instructions shortly.",
      rejected: "Unfortunately, we cannot process your return request at this time.",
      in_transit: "We've received your returned item(s) and are processing your return.",
      completed: "Your return has been processed successfully!",
    }

    const message = statusMessages[newStatus as keyof typeof statusMessages] || "Your return status has been updated."

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Return Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1D4ED8;">Return Status Update</h1>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1D4ED8;">
            <h2 style="margin-top: 0;">Status: ${newStatus.toUpperCase()}</h2>
            <p style="font-size: 16px; margin-bottom: 0;">${message}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <p><strong>Order Number:</strong> #${returnData.shopify_order_id}</p>
            <p><strong>Return ID:</strong> ${returnData.id}</p>
            <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
            <p>Questions? Contact us at support@${merchant.shop_domain}</p>
          </div>
        </body>
      </html>
    `
  }

  private generateShippingLabelTemplate(returnData: Return, merchant: Merchant, labelUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Return Shipping Label</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1D4ED8;">Return Shipping Label</h1>
          
          <div style="background: #dcfdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h2 style="margin-top: 0; color: #065f46;">Your return has been approved!</h2>
            <p>Please find your prepaid return shipping label attached to this email.</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3>Return Instructions:</h3>
            <ol style="padding-left: 20px;">
              <li>Print the attached shipping label</li>
              <li>Package your item(s) securely in the original packaging if possible</li>
              <li>Attach the shipping label to the outside of the package</li>
              <li>Drop off at any authorized shipping location</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${labelUrl}" 
               style="background: #1D4ED8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Download Shipping Label
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0;"><strong>Important:</strong> Please ship your return within 7 days to ensure timely processing.</p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Order: #${returnData.shopify_order_id} | Return ID: ${returnData.id}
          </p>
        </body>
      </html>
    `
  }
}

export const emailService = EmailService.getInstance()
