import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { aiService } from "@/lib/ai-service"
import { requireAuth } from "@/lib/auth"

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const supabase = createServerClient()
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "30" // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(timeframe))

    // Get recent returns for analysis
    const { data: returns, error } = await supabase
      .from("returns")
      .select(`
        id,
        reason,
        status,
        total_amount,
        customer_email,
        created_at,
        return_items(product_name, action),
        ai_suggestions(accepted, confidence_score)
      `)
      .eq("merchant_id", user.merchantId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Prepare data for AI analysis
    const returnAnalysisData =
      returns?.map((r) => ({
        id: r.id,
        reason: r.reason,
        productName: r.return_items[0]?.product_name || "Unknown",
        customerEmail: r.customer_email,
      })) || []

    // Generate AI insights
    const aiInsights = await aiService.analyzeBulkReturns(returnAnalysisData)

    // Calculate key metrics
    const totalReturns = returns?.length || 0
    const exchangeReturns =
      returns?.filter((r) => r.return_items.some((item) => item.action === "exchange")).length || 0
    const exchangeRate = totalReturns > 0 ? (exchangeReturns / totalReturns) * 100 : 0

    const aiSuggestions = returns?.flatMap((r) => r.ai_suggestions) || []
    const acceptedSuggestions = aiSuggestions.filter((s) => s.accepted === true).length
    const aiAcceptanceRate = aiSuggestions.length > 0 ? (acceptedSuggestions / aiSuggestions.length) * 100 : 0

    // Top return reasons
    const reasonCounts =
      returns?.reduce((acc: Record<string, number>, r) => {
        acc[r.reason] = (acc[r.reason] || 0) + 1
        return acc
      }, {}) || {}

    const topReasons = Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }))

    // Revenue impact
    const totalReturnValue = returns?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const exchangeValue =
      returns
        ?.filter((r) => r.return_items.some((item) => item.action === "exchange"))
        .reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
    const revenueSaved = exchangeValue

    // Trend data (last 7 days)
    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayReturns =
        returns?.filter((r) => {
          const returnDate = new Date(r.created_at)
          return returnDate >= dayStart && returnDate <= dayEnd
        }) || []

      const dayExchanges = dayReturns.filter((r) => r.return_items.some((item) => item.action === "exchange")).length

      trendData.push({
        date: dayStart.toISOString().split("T")[0],
        returns: dayReturns.length,
        exchanges: dayExchanges,
      })
    }

    const insights = {
      summary: {
        totalReturns,
        exchangeRate: Math.round(exchangeRate),
        aiAcceptanceRate: Math.round(aiAcceptanceRate),
        revenueSaved: Math.round(revenueSaved),
        totalReturnValue: Math.round(totalReturnValue),
      },
      topReasons,
      trendData,
      aiInsights: {
        insights: aiInsights.insights,
        recommendations: aiInsights.recommendations,
        riskProducts: aiInsights.riskProducts,
      },
      performance: {
        averageConfidenceScore:
          aiSuggestions.length > 0
            ? aiSuggestions.reduce((sum, s) => sum + s.confidence_score, 0) / aiSuggestions.length
            : 0,
        totalSuggestions: aiSuggestions.length,
        acceptedSuggestions,
      },
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Analytics insights error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
