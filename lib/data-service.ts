
export interface ReturnWithDetails {
  id: string
  status: string
  shopify_order_id: string
  customer_email: string
  reason: string
  total_amount: number
  return_items: Array<{
    product_name: string
    quantity: number
  }>
  ai_suggestions: Array<{
    suggested_product_name: string
    confidence_score: number
    accepted?: boolean
  }>
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

export const dataService = {
  async getDashboardMetrics(merchantId: string): Promise<DashboardMetrics> {
    return {
      totalReturns: 125,
      totalReturnsChange: 12,
      exchangeRate: 65,
      exchangeRateChange: 8,
      aiAcceptanceRate: 78,
      aiAcceptanceRateChange: 15,
      revenueSaved: 2850,
      revenueSavedChange: 22
    }
  },

  async getReturns(merchantId: string, filters?: any): Promise<{ returns: ReturnWithDetails[] }> {
    return { returns: [] }
  },

  async getReturnTrends(merchantId: string, days: number): Promise<any[]> {
    return []
  },

  async getReturnReasons(merchantId: string): Promise<any[]> {
    return []
  },

  async updateReturnStatus(returnId: string, status: string, merchantId: string): Promise<boolean> {
    return true
  }
}
