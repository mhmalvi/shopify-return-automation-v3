import { type NextRequest, NextResponse } from "next/server"
import { ShopifyService } from "@/lib/shopify-service"

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, merchantDomain } = await request.json()

    if (!orderNumber || !merchantDomain) {
      return NextResponse.json({ error: "Order number and merchant domain are required" }, { status: 400 })
    }

    // Handle demo environment - return mock data for demo-store
    if (merchantDomain === "demo-store" || merchantDomain === "demo-store.myshopify.com") {
      const mockOrder = {
        id: "5555555555555",
        order_number: orderNumber,
        email: "customer@example.com",
        created_at: "2024-01-15T10:30:00Z",
        financial_status: "paid",
        fulfillment_status: "fulfilled",
        total_price: "89.99",
        currency: "USD",
        customer: {
          id: "1111111111111",
          email: "customer@example.com",
          first_name: "John",
          last_name: "Doe",
        },
        line_items: [
          {
            id: "2222222222222",
            product_id: "3333333333333",
            variant_id: "4444444444444",
            title: "Premium T-Shirt",
            variant_title: "Large / Blue",
            quantity: 1,
            price: "29.99",
            sku: "TSHIRT-L-BLUE",
            fulfillment_status: "fulfilled",
            properties: [],
          },
          {
            id: "2222222222223",
            product_id: "3333333333334",
            variant_id: "4444444444445",
            title: "Cotton Hoodie",
            variant_title: "Medium / Gray",
            quantity: 2,
            price: "30.00",
            sku: "HOODIE-M-GRAY",
            fulfillment_status: "fulfilled",
            properties: [],
          },
        ],
        shipping_address: {
          first_name: "John",
          last_name: "Doe",
          address1: "123 Main St",
          address2: "Apt 4B",
          city: "New York",
          province: "NY",
          country: "United States",
          zip: "10001",
          phone: "+1-555-123-4567",
        },
        billing_address: {
          first_name: "John",
          last_name: "Doe",
          address1: "123 Main St",
          address2: "Apt 4B",
          city: "New York",
          province: "NY",
          country: "United States",
          zip: "10001",
          phone: "+1-555-123-4567",
        },
      }

      return NextResponse.json({ order: mockOrder })
    }

    // For real merchants, use Shopify API
    const shopifyService = new ShopifyService(merchantDomain)
    const order = await shopifyService.findOrderByNumber(orderNumber)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error("Order lookup error:", error)

    // Return a more specific error message
    if (error.message?.includes("Shopify API error")) {
      return NextResponse.json(
        { error: "Unable to connect to store. Please check your store domain." },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: "Failed to lookup order" }, { status: 500 })
  }
}
