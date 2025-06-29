import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, merchantDomain } = await request.json()

    // For demo environment, always return mock data
    if (merchantDomain === "demo-store.myshopify.com" || merchantDomain === "demo-store") {
      const mockOrder = {
        id: "1001",
        order_number: orderNumber || "1001",
        email: "customer@example.com",
        created_at: "2024-01-15T10:30:00Z",
        financial_status: "paid",
        fulfillment_status: "fulfilled",
        total_price: "89.99",
        currency: "USD",
        customer: {
          id: "1",
          email: "customer@example.com",
          first_name: "John",
          last_name: "Doe",
        },
        line_items: [
          {
            id: "1",
            product_id: "1",
            variant_id: "1",
            title: "Premium Wireless Headphones",
            variant_title: "Black",
            quantity: 1,
            price: "89.99",
            sku: "PWH-001-BLK",
            vendor: "TechCorp",
            product_exists: true,
            fulfillable_quantity: 0,
            grams: 350,
            requires_shipping: true,
            taxable: true,
            gift_card: false,
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

      return NextResponse.json({
        success: true,
        order: mockOrder,
      })
    }

    // For real stores, you would implement actual Shopify API calls here
    return NextResponse.json(
      {
        success: false,
        error: "Order lookup not implemented for production stores yet",
      },
      { status: 501 },
    )
  } catch (error) {
    console.error("Error in order lookup:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to lookup order",
      },
      { status: 500 },
    )
  }
}
