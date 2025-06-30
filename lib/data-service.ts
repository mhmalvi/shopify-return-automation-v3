
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
  }
}
