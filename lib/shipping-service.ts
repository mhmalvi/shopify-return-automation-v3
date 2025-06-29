import EasyPost from "@easypost/api"
import type { Return, Merchant } from "./types"

const easypost = new EasyPost(process.env.EASYPOST_API_KEY || "")

export interface ShippingAddress {
  name: string
  street1: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
  email?: string
}

export interface ShippingLabel {
  id: string
  tracking_code: string
  label_url: string
  postage_label_url: string
  rate: number
  carrier: string
  service: string
  estimated_delivery_date?: string
}

export class ShippingService {
  private static instance: ShippingService

  public static getInstance(): ShippingService {
    if (!ShippingService.instance) {
      ShippingService.instance = new ShippingService()
    }
    return ShippingService.instance
  }

  async generateReturnLabel(
    returnData: Return,
    merchant: Merchant,
    customerAddress: ShippingAddress,
    carrierPreference = "USPS",
  ): Promise<ShippingLabel | null> {
    try {
      // Get merchant's return address from settings
      const returnAddress = this.getMerchantReturnAddress(merchant)

      // Create EasyPost addresses
      const fromAddress = await easypost.Address.create({
        name: customerAddress.name,
        street1: customerAddress.street1,
        street2: customerAddress.street2,
        city: customerAddress.city,
        state: customerAddress.state,
        zip: customerAddress.zip,
        country: customerAddress.country || "US",
        phone: customerAddress.phone,
        email: customerAddress.email,
      })

      const toAddress = await easypost.Address.create({
        name: returnAddress.name,
        street1: returnAddress.street1,
        street2: returnAddress.street2,
        city: returnAddress.city,
        state: returnAddress.state,
        zip: returnAddress.zip,
        country: returnAddress.country || "US",
        phone: returnAddress.phone,
      })

      // Create parcel (estimate based on return items)
      const parcel = await easypost.Parcel.create({
        length: 12,
        width: 8,
        height: 6,
        weight: 16, // 1 lb default
      })

      // Create shipment
      const shipment = await easypost.Shipment.create({
        to_address: toAddress,
        from_address: fromAddress,
        parcel: parcel,
        options: {
          label_format: "PDF",
          label_size: "4x6",
        },
      })

      // Find the best rate for the preferred carrier
      const preferredRate = this.selectBestRate(shipment.rates, carrierPreference)

      if (!preferredRate) {
        throw new Error(`No rates available for carrier: ${carrierPreference}`)
      }

      // Buy the shipment
      const boughtShipment = await easypost.Shipment.buy(shipment.id, {
        rate: preferredRate,
      })

      return {
        id: boughtShipment.id,
        tracking_code: boughtShipment.tracking_code,
        label_url: boughtShipment.postage_label.label_url,
        postage_label_url: boughtShipment.postage_label.label_url,
        rate: Number.parseFloat(preferredRate.rate),
        carrier: preferredRate.carrier,
        service: preferredRate.service,
        estimated_delivery_date: boughtShipment.selected_rate?.est_delivery_date,
      }
    } catch (error) {
      console.error("Failed to generate return label:", error)
      return null
    }
  }

  async trackShipment(trackingCode: string, carrier: string): Promise<any> {
    try {
      const tracker = await easypost.Tracker.create({
        tracking_code: trackingCode,
        carrier: carrier,
      })

      return {
        tracking_code: tracker.tracking_code,
        status: tracker.status,
        status_detail: tracker.status_detail,
        tracking_details: tracker.tracking_details,
        estimated_delivery_date: tracker.est_delivery_date,
        updated_at: tracker.updated_at,
      }
    } catch (error) {
      console.error("Failed to track shipment:", error)
      return null
    }
  }

  async getRates(fromAddress: ShippingAddress, toAddress: ShippingAddress, weight = 16): Promise<any[]> {
    try {
      const from = await easypost.Address.create(fromAddress)
      const to = await easypost.Address.create(toAddress)
      const parcel = await easypost.Parcel.create({
        length: 12,
        width: 8,
        height: 6,
        weight: weight,
      })

      const shipment = await easypost.Shipment.create({
        to_address: to,
        from_address: from,
        parcel: parcel,
      })

      return shipment.rates.map((rate: any) => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: Number.parseFloat(rate.rate),
        currency: rate.currency,
        delivery_days: rate.delivery_days,
        delivery_date: rate.delivery_date,
        delivery_date_guaranteed: rate.delivery_date_guaranteed,
      }))
    } catch (error) {
      console.error("Failed to get shipping rates:", error)
      return []
    }
  }

  private selectBestRate(rates: any[], preferredCarrier: string): any {
    // Filter by preferred carrier
    const carrierRates = rates.filter((rate) => rate.carrier.toUpperCase().includes(preferredCarrier.toUpperCase()))

    if (carrierRates.length === 0) {
      // Fallback to cheapest rate if preferred carrier not available
      return rates.reduce((cheapest, current) =>
        Number.parseFloat(current.rate) < Number.parseFloat(cheapest.rate) ? current : cheapest,
      )
    }

    // Return cheapest rate from preferred carrier
    return carrierRates.reduce((cheapest, current) =>
      Number.parseFloat(current.rate) < Number.parseFloat(cheapest.rate) ? current : cheapest,
    )
  }

  private getMerchantReturnAddress(merchant: Merchant): ShippingAddress {
    // Get return address from merchant settings or use default
    const settings = merchant.settings

    return {
      name: settings.return_address?.name || merchant.shop_domain,
      street1: settings.return_address?.street1 || "123 Business St",
      street2: settings.return_address?.street2,
      city: settings.return_address?.city || "Business City",
      state: settings.return_address?.state || "CA",
      zip: settings.return_address?.zip || "90210",
      country: settings.return_address?.country || "US",
      phone: settings.return_address?.phone || "555-123-4567",
    }
  }

  // Webhook handler for tracking updates
  async handleTrackingWebhook(webhookData: any): Promise<void> {
    try {
      const { tracking_code, status, status_detail } = webhookData

      // Update return status based on tracking status
      if (status === "delivered") {
        // Update return to "in_transit" status
        // This would trigger further processing
        console.log(`Package delivered: ${tracking_code}`)
      }
    } catch (error) {
      console.error("Failed to handle tracking webhook:", error)
    }
  }
}

export const shippingService = ShippingService.getInstance()
