import { type NextRequest, NextResponse } from "next/server"
import { ShopifyService } from "@/lib/shopify-service"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, email, merchantDomain } = await request.json()

    if (!orderNumber || !email) {
      return NextResponse.json({ error: "Order number and email are required" }, { status: 400 })
    }

    // Handle demo environment - return mock data immediately
    if (merchantDomain === "demo-store" || merchantDomain === "demo-store.myshopify.com") {
      const mockOrder = {
        id: "5000000001",
        order_number: orderNumber,
        email: email,
        created_at: "2024-01-15T10:30:00Z",
        financial_status: "paid",
        fulfillment_status: "fulfilled",
        total_price: "89.99",
        currency: "USD",
        customer: {
          first_name: "John",
          last_name: "Doe",
          email: email,
        },
        line_items: [
          {
            id: "12345678901234567890",
            name: "Premium Wireless Headphones",
            quantity: 1,
            price: "79.99",
            sku: "PWH-001",
            variant_title: "Black",
            product_id: "7891011121314151617",
            variant_id: "1819202122232425262",
          },
          {
            id: "12345678901234567891",
            name: "Shipping",
            quantity: 1,
            price: "10.00",
            sku: "SHIPPING",
            variant_title: null,
            product_id: null,
            variant_id: null,
          },
        ],
        shipping_address: {
          first_name: "John",
          last_name: "Doe",
          address1: "123 Main Street",
          address2: "Apt 4B",
          city: "New York",
          province: "NY",
          zip: "10001",
          country: "United States",
          phone: "+1-555-123-4567",
        },
        billing_address: {
          first_name: "John",
          last_name: "Doe",
          address1: "123 Main Street",
          address2: "Apt 4B",
          city: "New York",
          province: "NY",
          zip: "10001",
          country: "United States",
          phone: "+1-555-123-4567",
        },
      }

      return NextResponse.json({ order: mockOrder })
    }

    // For real merchants, fetch from database and Shopify
    const supabase = createServerClient()

    // Find merchant by domain
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("*")
      .eq("shop_domain", merchantDomain)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    if (!merchant.access_token) {
      return NextResponse.json({ error: "Merchant not properly configured" }, { status: 400 })
    }

    // Use Shopify service to find the order
    const shopifyService = new ShopifyService(merchant.shop_domain, merchant.access_token)
    const order = await shopifyService.findOrderByNumber(orderNumber, email)

    if (!order) {
      return NextResponse.json({ error: "Order not found or email doesn't match" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error("Order lookup error:", error)
    return NextResponse.json({ error: error.message || "Failed to lookup order" }, { status: 500 })
  }
}
