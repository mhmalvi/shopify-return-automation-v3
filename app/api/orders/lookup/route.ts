import { type NextRequest, NextResponse } from "next/server"
import { createShopifyService } from "@/lib/shopify-service"
import { dataService } from "@/lib/data-service"

export async function POST(request: NextRequest) {
  try {
    const { merchant_domain, order_number, customer_email } = await request.json()

    if (!merchant_domain || !order_number || !customer_email) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get merchant data
    const merchant = await dataService.getMerchantByDomain(merchant_domain)
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    // Create Shopify service instance
    const shopifyService = createShopifyService(merchant.shop_domain, merchant.access_token)

    // Look up order
    const order = await shopifyService.findOrderByNumber(order_number, customer_email)
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Order lookup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
