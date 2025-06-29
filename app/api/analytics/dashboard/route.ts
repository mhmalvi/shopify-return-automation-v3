import { type NextRequest, NextResponse } from "next/server"
import { dataService } from "@/lib/data-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get("merchant_id") || "550e8400-e29b-41d4-a716-446655440000"

    // Get dashboard metrics using the data service
    const metrics = await dataService.getDashboardMetrics(merchantId)

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error("Analytics dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
