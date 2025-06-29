import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("🔍 Starting database diagnostic...")

    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from("merchants")
      .select("count", { count: "exact", head: true })

    if (connectionError) {
      console.error("❌ Database connection failed:", connectionError)
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: connectionError.message,
      })
    }

    console.log("✅ Database connection successful")

    // Test 2: Check all table counts
    const tables = [
      "merchants",
      "users",
      "returns",
      "return_items",
      "ai_suggestions",
      "analytics_events",
      "billing_records",
    ]
    const tableCounts: Record<string, number> = {}

    for (const table of tables) {
      try {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })

        tableCounts[table] = count || 0
        console.log(`📊 ${table}: ${count || 0} rows`)
      } catch (error) {
        console.error(`❌ Error checking ${table}:`, error)
        tableCounts[table] = -1
      }
    }

    // Test 3: Check specific merchant
    const merchantId = "550e8400-e29b-41d4-a716-446655440000"
    const { data: merchant, error: merchantError } = await supabase
      .from("merchants")
      .select("*")
      .eq("id", merchantId)
      .maybeSingle()

    console.log("🏪 Demo merchant check:", merchant ? "EXISTS" : "NOT FOUND")
    if (merchantError) {
      console.error("❌ Merchant query error:", merchantError)
    }

    // Test 4: Check returns for this merchant
    const { data: returns, error: returnsError } = await supabase
      .from("returns")
      .select(`
        *,
        return_items(*),
        ai_suggestions(*)
      `)
      .eq("merchant_id", merchantId)

    console.log(`📦 Returns for demo merchant: ${returns?.length || 0}`)
    if (returnsError) {
      console.error("❌ Returns query error:", returnsError)
    }

    // Test 5: Check if RLS is blocking the queries
    const { data: rawReturns, error: rawError } = await supabase
      .from("returns")
      .select("id, shopify_order_id, status, reason, total_amount")
      .eq("merchant_id", merchantId)

    console.log(`🔒 RLS test - Returns found: ${rawReturns?.length || 0}`)
    if (rawError) {
      console.error("❌ RLS test error:", rawError)
    }

    return NextResponse.json({
      success: true,
      diagnostic: {
        connection: "OK",
        tableCounts,
        demoMerchant: {
          exists: !!merchant,
          data: merchant,
        },
        demoReturns: {
          count: returns?.length || 0,
          data: returns?.slice(0, 3), // First 3 returns for debugging
        },
        rlsTest: {
          count: rawReturns?.length || 0,
          data: rawReturns?.slice(0, 3),
        },
        errors: {
          merchant: merchantError?.message,
          returns: returnsError?.message,
          rls: rawError?.message,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("💥 Diagnostic failed:", error)
    return NextResponse.json({
      success: false,
      error: "Diagnostic failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
