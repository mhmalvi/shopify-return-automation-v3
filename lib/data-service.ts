
export interface ReturnWithDetails {
  id: string
  order_number: string
  customer_email: string
  reason: string
  status: string
  created_at: string
  items: Array<{
    product_name: string
    quantity: number
    price: number
  }>
}

export interface DashboardMetrics {
  totalReturns: number
  pendingReturns: number
  processedReturns: number
  totalRefunded: number
}

// Mock data service for now
export const dataService = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return {
      totalReturns: 0,
      pendingReturns: 0,
      processedReturns: 0,
      totalRefunded: 0
    }
  },
  
  async getReturns(): Promise<ReturnWithDetails[]> {
    return []
  },

  async getMerchant(merchantId: string): Promise<any> {
    // Mock implementation
    return {
      id: merchantId,
      shop_domain: "demo-store",
      access_token: "demo-token",
      plan_type: "starter",
      settings: {}
    }
  },

  async getMerchantByDomain(domain: string): Promise<any> {
    // Mock implementation
    return {
      id: "550e8400-e29b-41d4-a716-446655440000",
      shop_domain: domain,
      access_token: "demo-token",
      plan_type: "starter",
      settings: {}
    }
  }
}
