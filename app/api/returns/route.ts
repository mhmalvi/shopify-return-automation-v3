import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { createShopifyService } from "@/lib/shopify-service"
import { aiService } from "@/lib/ai-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get("merchant_id") || "550e8400-e29b-41d4-a716-446655440000"
    const status = searchParams.get("status")

    let query = supabase
      .from("returns")
      .select(`
        *,
        return_items(*),
        ai_suggestions(*)
      `)
      .eq("merchant_id", merchantId)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: returns, error } = await query.order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ returns })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body = await request.json()

    const { merchant_domain, order_number, customer_email, reason, items } = body

    // Get merchant info
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("*")
      .eq("shop_domain", merchant_domain)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    // Verify order with Shopify
    const shopifyService = createShopifyService(merchant.shop_domain, merchant.access_token)
    const shopifyOrder = await shopifyService.findOrderByNumber(order_number, customer_email)

    if (!shopifyOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Calculate total amount for return
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

    // Create return record
    const { data: returnRecord, error: returnError } = await supabase
      .from("returns")
      .insert({
        merchant_id: merchant.id,
        shopify_order_id: shopifyOrder.id,
        customer_email,
        status: "requested",
        reason,
        total_amount: totalAmount,
      })
      .select()
      .single()

    if (returnError) {
      return NextResponse.json({ error: returnError.message }, { status: 500 })
    }

    // Create return items
    const returnItems = items.map((item: any) => ({
      return_id: returnRecord.id,
      product_id: item.product_id,
      product_name: item.product_name,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.price,
      action: item.action,
      exchange_product_id: item.exchange_product_id,
    }))

    const { error: itemsError } = await supabase.from("return_items").insert(returnItems)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Generate AI suggestions for exchange items
    const exchangeItems = items.filter((item: any) => item.action === "exchange")

    if (exchangeItems.length > 0) {
      for (const item of exchangeItems) {
        try {
          // Get product details from Shopify
          const product = await shopifyService.getProduct(item.product_id)
          const similarProducts = await shopifyService.getSimilarProducts(item.product_id, product?.product_type)

          const aiSuggestion = await aiService.generateExchangeSuggestion({
            reason,
            productName: item.product_name,
            productCategory: product?.product_type,
            availableProducts: similarProducts.map((p) => ({
              id: p.id,
              name: p.title,
              category: p.product_type,
              price: Number.parseFloat(p.variants[0]?.price || "0"),
              inStock: (p.variants[0]?.inventory_quantity || 0) > 0,
            })),
          })

          if (aiSuggestion && aiSuggestion.confidence > 0.5) {
            await supabase.from("ai_suggestions").insert({
              return_id: returnRecord.id,
              suggestion_type: aiSuggestion.suggestedAction,
              suggested_product_id: aiSuggestion.productId,
              suggested_product_name: aiSuggestion.productName,
              confidence_score: aiSuggestion.confidence,
              reasoning: aiSuggestion.reasoning,
            })
          }
        } catch (aiError) {
          console.error("AI suggestion generation failed:", aiError)
          // Continue without AI suggestion
        }
      }
    }

    // Log analytics event
    await supabase.from("analytics_events").insert({
      merchant_id: merchant.id,
      event_type: "return_created",
      event_data: {
        return_id: returnRecord.id,
        reason,
        total_amount: totalAmount,
        items_count: items.length,
        has_exchange: exchangeItems.length > 0,
      },
    })

    return NextResponse.json({
      success: true,
      return_id: returnRecord.id,
      message: "Return request submitted successfully",
    })
  } catch (error) {
    console.error("Return creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
