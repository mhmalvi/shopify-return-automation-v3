import { supabase } from "./supabase"
import type { Return, ReturnItem, AISuggestion, Merchant, User } from "./types"

export interface ReturnWithDetails extends Return {
  return_items: ReturnItem[]
  ai_suggestions: AISuggestion[]
}

export interface DashboardMetrics {
  totalReturns: number
  totalReturnsChange: number
  exchangeRate: number
  exchangeRateChange: number
  aiAcceptanceRate: number
  aiAcceptanceRateChange: number
  revenueSaved: number
  revenueSavedChange: number
}

export class DataService {
  private static instance: DataService

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService()
    }
    return DataService.instance
  }

  // Returns Management
  async getReturns(
    merchantId: string,
    filters?: {
      status?: string
      search?: string
      limit?: number
      offset?: number
    },
  ): Promise<{ returns: ReturnWithDetails[]; total: number }> {
    try {
      let query = supabase
        .from("returns")
        .select(`
          *,
          return_items(*),
          ai_suggestions(*)
        `)
        .eq("merchant_id", merchantId)

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status)
      }

      if (filters?.search) {
        query = query.or(`customer_email.ilike.%${filters.search}%,shopify_order_id.ilike.%${filters.search}%`)
      }

      // Get total count
      const { count } = await supabase
        .from("returns")
        .select("*", { count: "exact", head: true })
        .eq("merchant_id", merchantId)

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error

      return {
        returns: data || [],
        total: count || 0,
      }
    } catch (error) {
      console.error("Failed to fetch returns:", error)
      return { returns: [], total: 0 }
    }
  }

  async getReturn(returnId: string): Promise<ReturnWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from("returns")
        .select(`
          *,
          return_items(*),
          ai_suggestions(*)
        `)
        .eq("id", returnId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Failed to fetch return:", error)
      return null
    }
  }

  async updateReturnStatus(returnId: string, status: string, merchantId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("returns")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", returnId)
        .eq("merchant_id", merchantId)

      if (error) throw error

      // Log analytics event
      await this.logAnalyticsEvent(merchantId, "return_status_updated", {
        return_id: returnId,
        new_status: status,
      })

      return true
    } catch (error) {
      console.error("Failed to update return status:", error)
      return false
    }
  }

  // Dashboard Metrics
  async getDashboardMetrics(merchantId: string): Promise<DashboardMetrics> {
    try {
      console.log(`[DataService] Getting dashboard metrics for merchant: ${merchantId}`)

      // Get all returns for this merchant (no date filtering for demo)
      const { data: allReturns, error: returnsError } = await supabase
        .from("returns")
        .select(`
          *,
          return_items(*),
          ai_suggestions(*)
        `)
        .eq("merchant_id", merchantId)

      if (returnsError) {
        console.error("Error fetching returns:", returnsError)
        throw returnsError
      }

      console.log(`[DataService] Found ${allReturns?.length || 0} returns`)

      const totalReturns = allReturns?.length || 0

      // Calculate exchange rate
      let exchangeCount = 0
      let totalReturnValue = 0
      let exchangeValue = 0

      allReturns?.forEach((returnItem) => {
        totalReturnValue += returnItem.total_amount || 0

        const hasExchange = returnItem.return_items?.some((item: any) => item.action === "exchange")
        if (hasExchange) {
          exchangeCount++
          exchangeValue += returnItem.total_amount || 0
        }
      })

      const exchangeRate = totalReturns > 0 ? Math.round((exchangeCount / totalReturns) * 100) : 0

      // Calculate AI acceptance rate
      const allSuggestions = allReturns?.flatMap((ret) => ret.ai_suggestions || []) || []
      const acceptedSuggestions = allSuggestions.filter((s: any) => s.accepted === true).length
      const aiAcceptanceRate =
        allSuggestions.length > 0 ? Math.round((acceptedSuggestions / allSuggestions.length) * 100) : 0

      const revenueSaved = Math.round(exchangeValue)

      console.log(`[DataService] Metrics calculated:`, {
        totalReturns,
        exchangeRate,
        aiAcceptanceRate,
        revenueSaved,
        exchangeCount,
        totalSuggestions: allSuggestions.length,
        acceptedSuggestions,
      })

      return {
        totalReturns,
        totalReturnsChange: 12, // Mock change percentage
        exchangeRate,
        exchangeRateChange: 8,
        aiAcceptanceRate,
        aiAcceptanceRateChange: 15,
        revenueSaved,
        revenueSavedChange: 23,
      }
    } catch (error) {
      console.error("Failed to fetch dashboard metrics:", error)
      // Return fallback data
      return {
        totalReturns: 0,
        totalReturnsChange: 0,
        exchangeRate: 0,
        exchangeRateChange: 0,
        aiAcceptanceRate: 0,
        aiAcceptanceRateChange: 0,
        revenueSaved: 0,
        revenueSavedChange: 0,
      }
    }
  }

  // Analytics
  async getReturnTrends(
    merchantId: string,
    days = 30,
  ): Promise<
    Array<{
      date: string
      returns: number
      exchanges: number
    }>
  > {
    try {
      console.log(`[DataService] Getting return trends for merchant: ${merchantId}`)

      // For demo purposes, let's create some sample trend data
      // In a real app, this would query actual data by date ranges
      const { data: returns } = await supabase
        .from("returns")
        .select(`
          created_at,
          return_items(action)
        `)
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: true })

      console.log(`[DataService] Found ${returns?.length || 0} returns for trends`)

      // Generate trend data for the last 7 days
      const result = []
      const today = new Date()

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split("T")[0]

        // For demo, add some sample data
        const dayReturns = i === 3 ? 2 : i === 1 ? 1 : 0 // Sample data
        const dayExchanges = i === 3 ? 1 : 0

        result.push({
          date: dateStr,
          returns: dayReturns,
          exchanges: dayExchanges,
        })
      }

      console.log(`[DataService] Generated trend data:`, result)
      return result
    } catch (error) {
      console.error("Failed to fetch return trends:", error)
      return []
    }
  }

  async getReturnReasons(merchantId: string): Promise<
    Array<{
      name: string
      value: number
      color: string
    }>
  > {
    try {
      console.log(`[DataService] Getting return reasons for merchant: ${merchantId}`)

      const { data: returns } = await supabase.from("returns").select("reason").eq("merchant_id", merchantId)

      console.log(`[DataService] Found ${returns?.length || 0} returns for reasons analysis`)

      const reasonCounts: Record<string, number> = {}
      returns?.forEach((ret) => {
        reasonCounts[ret.reason] = (reasonCounts[ret.reason] || 0) + 1
      })

      const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00"]

      const result = Object.entries(reasonCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index] || "#cccccc",
        }))

      console.log(`[DataService] Return reasons:`, result)
      return result
    } catch (error) {
      console.error("Failed to fetch return reasons:", error)
      return []
    }
  }

  // Merchant Management
  async getMerchant(merchantId: string): Promise<Merchant | null> {
    try {
      const { data, error } = await supabase.from("merchants").select("*").eq("id", merchantId).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Failed to fetch merchant:", error)
      return null
    }
  }

  async getMerchantByDomain(domain: string): Promise<Merchant | null> {
    try {
      console.log(`[DataService] Looking up merchant for domain: "${domain}"`)

      // If the user entered just "demo-store", append ".myshopify.com"
      let fullDomain = domain.trim().toLowerCase()
      if (!fullDomain.endsWith(".myshopify.com")) {
        fullDomain = `${fullDomain}.myshopify.com`
      }

      console.log(`[DataService] Normalized domain: "${fullDomain}"`)

      // First try exact match
      let { data, error } = await supabase.from("merchants").select("*").eq("shop_domain", fullDomain).maybeSingle()

      if (error) {
        console.error(`[DataService] Database error (exact match):`, error)

        // Try case-insensitive lookup as fallback
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("merchants")
          .select("*")
          .ilike("shop_domain", fullDomain)
          .maybeSingle()

        if (fallbackError) {
          console.error(`[DataService] Database error (fallback):`, fallbackError)
          throw fallbackError
        }

        data = fallbackData
      }

      console.log(`[DataService] Query result:`, data ? "Found merchant" : "No merchant found")

      if (data) {
        console.log(`[DataService] Merchant details:`, {
          id: data.id,
          shop_domain: data.shop_domain,
          plan_type: data.plan_type,
        })
      }

      return data ?? null
    } catch (error) {
      console.error(`[DataService] Failed to fetch merchant by domain:`, error)
      return null
    }
  }

  async updateMerchantSettings(merchantId: string, settings: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("merchants")
        .update({
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", merchantId)

      return !error
    } catch (error) {
      console.error("Failed to update merchant settings:", error)
      return false
    }
  }

  // User Management
  async getUsers(merchantId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Failed to fetch users:", error)
      return []
    }
  }

  // Analytics Events
  async logAnalyticsEvent(merchantId: string, eventType: string, eventData: any): Promise<void> {
    try {
      await supabase.from("analytics_events").insert({
        merchant_id: merchantId,
        event_type: eventType,
        event_data: eventData,
      })
    } catch (error) {
      console.error("Failed to log analytics event:", error)
    }
  }

  // AI Suggestions
  async updateAISuggestionFeedback(suggestionId: string, accepted: boolean): Promise<boolean> {
    try {
      const { error } = await supabase.from("ai_suggestions").update({ accepted }).eq("id", suggestionId)

      return !error
    } catch (error) {
      console.error("Failed to update AI suggestion feedback:", error)
      return false
    }
  }

  // Real-time subscriptions
  subscribeToReturns(merchantId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`returns:${merchantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "returns",
          filter: `merchant_id=eq.${merchantId}`,
        },
        callback,
      )
      .subscribe()
  }
}

export const dataService = DataService.getInstance()
