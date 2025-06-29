import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    console.log("🌱 Starting data seeding...")

    const merchantId = "550e8400-e29b-41d4-a716-446655440000"

    // Step 1: Clean existing data (fixed the iteration issue)
    console.log("🧹 Cleaning existing demo data...")

    // Delete in correct order to avoid foreign key constraints
    await supabase
      .from("ai_suggestions")
      .delete()
      .in(
        "return_id",
        (await supabase.from("returns").select("id").eq("merchant_id", merchantId)).data?.map((r) => r.id) || [],
      )

    await supabase
      .from("return_items")
      .delete()
      .in(
        "return_id",
        (await supabase.from("returns").select("id").eq("merchant_id", merchantId)).data?.map((r) => r.id) || [],
      )

    await supabase.from("analytics_events").delete().eq("merchant_id", merchantId)
    await supabase.from("billing_records").delete().eq("merchant_id", merchantId)
    await supabase.from("returns").delete().eq("merchant_id", merchantId)
    await supabase.from("users").delete().eq("merchant_id", merchantId)
    await supabase.from("merchants").delete().eq("id", merchantId)

    console.log("✅ Cleanup completed")

    // Step 2: Insert merchant
    console.log("🏪 Inserting demo merchant...")
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .insert({
        id: merchantId,
        shop_domain: "demo-store.myshopify.com",
        access_token: "encrypted_demo_token_12345",
        settings: {
          brand_color: "#1D4ED8",
          logo_url: "/placeholder.svg?height=40&width=120",
          return_policy: "We accept returns within 30 days of purchase.",
          shop_name: "Demo Store",
        },
        plan_type: "growth",
      })
      .select()
      .single()

    if (merchantError) {
      console.error("❌ Merchant insert failed:", merchantError)
      throw merchantError
    }

    console.log("✅ Merchant inserted")

    // Step 3: Insert user
    console.log("👤 Inserting demo user...")
    const { error: userError } = await supabase.from("users").insert({
      merchant_id: merchantId,
      email: "admin@demo-store.com",
      role: "admin",
    })

    if (userError) {
      console.error("❌ User insert failed:", userError)
      throw userError
    }

    console.log("✅ User inserted")

    // Step 4: Insert returns
    console.log("📦 Inserting demo returns...")
    const returnIds = [
      "660e8400-e29b-41d4-a716-446655440001",
      "660e8400-e29b-41d4-a716-446655440002",
      "660e8400-e29b-41d4-a716-446655440003",
    ]

    const returnsData = [
      {
        id: returnIds[0],
        merchant_id: merchantId,
        shopify_order_id: "12345",
        customer_email: "customer@example.com",
        status: "requested",
        reason: "Item too small",
        total_amount: 29.99,
      },
      {
        id: returnIds[1],
        merchant_id: merchantId,
        shopify_order_id: "12346",
        customer_email: "another@example.com",
        status: "approved",
        reason: "Defective item",
        total_amount: 59.99,
      },
      {
        id: returnIds[2],
        merchant_id: merchantId,
        shopify_order_id: "12347",
        customer_email: "third@example.com",
        status: "completed",
        reason: "Wrong color",
        total_amount: 39.99,
      },
    ]

    const { data: returns, error: returnsError } = await supabase.from("returns").insert(returnsData).select()

    if (returnsError) {
      console.error("❌ Returns insert failed:", returnsError)
      throw returnsError
    }

    console.log(`✅ ${returns.length} returns inserted`)

    // Step 5: Insert return items
    console.log("📋 Inserting return items...")
    const returnItemsData = [
      {
        return_id: returnIds[0],
        product_id: "prod_123",
        product_name: "Premium Cotton T-Shirt",
        variant_id: "var_123_m_blue",
        quantity: 1,
        price: 29.99,
        action: "exchange",
        exchange_product_id: "var_123_l_blue",
      },
      {
        return_id: returnIds[1],
        product_id: "prod_456",
        product_name: "Denim Jeans",
        variant_id: "var_456_32_dark",
        quantity: 1,
        price: 59.99,
        action: "refund",
      },
      {
        return_id: returnIds[2],
        product_id: "prod_789",
        product_name: "Summer Dress",
        variant_id: "var_789_m_red",
        quantity: 1,
        price: 39.99,
        action: "exchange",
        exchange_product_id: "var_789_m_blue",
      },
    ]

    const { data: returnItems, error: itemsError } = await supabase
      .from("return_items")
      .insert(returnItemsData)
      .select()

    if (itemsError) {
      console.error("❌ Return items insert failed:", itemsError)
      throw itemsError
    }

    console.log(`✅ ${returnItems.length} return items inserted`)

    // Step 6: Insert AI suggestions
    console.log("🤖 Inserting AI suggestions...")
    const aiSuggestionsData = [
      {
        return_id: returnIds[0],
        suggestion_type: "exchange",
        suggested_product_id: "var_123_l_blue",
        suggested_product_name: "Premium Cotton T-Shirt - Size L / Blue",
        confidence_score: 0.92,
        reasoning: 'Based on your return reason "too small", we recommend trying the same item in a larger size.',
        accepted: true,
      },
      {
        return_id: returnIds[2],
        suggestion_type: "exchange",
        suggested_product_id: "var_789_m_blue",
        suggested_product_name: "Summer Dress - Size M / Blue",
        confidence_score: 0.87,
        reasoning: "Customer mentioned wrong color. Blue is a popular alternative for this style.",
        accepted: null,
      },
    ]

    const { data: aiSuggestions, error: aiError } = await supabase
      .from("ai_suggestions")
      .insert(aiSuggestionsData)
      .select()

    if (aiError) {
      console.error("❌ AI suggestions insert failed:", aiError)
      throw aiError
    }

    console.log(`✅ ${aiSuggestions.length} AI suggestions inserted`)

    // Step 7: Verify data
    console.log("🔍 Verifying inserted data...")
    const { data: verifyReturns, error: verifyError } = await supabase
      .from("returns")
      .select(`
        *,
        return_items(*),
        ai_suggestions(*)
      `)
      .eq("merchant_id", merchantId)

    if (verifyError) {
      console.error("❌ Verification failed:", verifyError)
      throw verifyError
    }

    console.log(`✅ Verification complete: ${verifyReturns.length} returns found`)

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully!",
      data: {
        merchant: merchant,
        returns: verifyReturns.length,
        returnItems: returnItems.length,
        aiSuggestions: aiSuggestions.length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Seeding failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Seeding failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
