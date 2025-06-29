import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, email, merchantDomain } = await request.json()

    // Always return demo data for demo environment
    if (merchantDomain === "demo-store" || merchantDomain === "demo-store.myshopify.com") {
      const mockOrder = {
        id: "1001",
        order_number: orderNumber || "1001",
        email: email || "customer@example.com",
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        financial_status: "paid",
        fulfillment_status: "fulfilled",
        total_price: "99.99",
        subtotal_price: "89.99",
        total_tax: "10.00",
        currency: "USD",
        customer: {
          id: "1",
          email: email || "customer@example.com",
          first_name: "John",
          last_name: "Doe",
          phone: "+1-555-123-4567",
        },
        line_items: [
          {
            id: "1",
            product_id: "123",
            variant_id: "456",
            title: "Premium T-Shirt",
            variant_title: "Large / Blue",
            quantity: 1,
            price: "29.99",
            sku: "TSHIRT-L-BLUE",
            vendor: "Demo Vendor",
            fulfillment_status: "fulfilled",
            requires_shipping: true,
            taxable: true,
            gift_card: false,
          },
          {
            id: "2",
            product_id: "789",
            variant_id: "101",
            title: "Cotton Hoodie",
            variant_title: "Medium / Gray",
            quantity: 1,
            price: "69.99",
            sku: "HOODIE-M-GRAY",
            vendor: "Demo Vendor",
            fulfillment_status: "fulfilled",
            requires_shipping: true,
            taxable: true,
            gift_card: false,
          },
        ],
        shipping_address: {
          first_name: "John",
          last_name: "Doe",
          company: "",
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
          company: "",
          address1: "123 Main St",
          address2: "Apt 4B",
          city: "New York",
          province: "NY",
          country: "United States",
          zip: "10001",
          phone: "+1-555-123-4567",
        },
        shipping_lines: [
          {
            id: "1",
            title: "Standard Shipping",
            price: "0.00",
            code: "standard",
          },
        ],
        tax_lines: [
          {
            title: "NY State Tax",
            price: "10.00",
            rate: 0.08,
          },
        ],
      }

      return NextResponse.json({
        success: true,
        order: mockOrder,
      })
    }

    // For production stores, return not implemented
    return NextResponse.json(
      {
        success: false,
        error: "Order lookup for production stores not implemented in demo",
      },
      { status: 501 },
    )
  } catch (error: any) {
    console.error("Order lookup error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to lookup order",
      },
      { status: 500 },
    )
  }
}
