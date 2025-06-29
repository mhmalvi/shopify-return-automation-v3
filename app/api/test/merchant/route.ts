import { NextResponse } from "next/server"
import { dataService } from "@/lib/data-service"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    console.log("Testing database connection...")

    // Test basic Supabase connection
    const { data: testData, error: testError } = await supabase.from("merchants").select("id, shop_domain").limit(5)

    if (testError) {
      console.error("Supabase connection error:", testError)
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: testError.message,
      })
    }

    console.log("Raw merchants data:", testData)

    // Test the data service
    const merchant = await dataService.getMerchantByDomain("demo-store")

    return NextResponse.json({
      success: true,
      rawMerchants: testData,
      demoStoreLookup: merchant,
      message: "Database connection successful",
    })
  } catch (error) {
    console.error("Test endpoint error:", error)
    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
