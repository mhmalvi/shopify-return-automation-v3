export interface Merchant {
  id: string
  shop_domain: string
  access_token: string
  settings: {
    brand_color?: string
    logo_url?: string
    return_policy?: string
  }
  plan_type: "starter" | "growth" | "pro"
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  merchant_id: string
  email: string
  role: "admin" | "staff"
  created_at: string
}

export interface Return {
  id: string
  merchant_id: string
  shopify_order_id: string
  customer_email: string
  status: "requested" | "approved" | "rejected" | "in_transit" | "completed"
  reason: string
  total_amount: number
  created_at: string
  updated_at: string
}

export interface ReturnItem {
  id: string
  return_id: string
  product_id: string
  product_name: string
  variant_id: string
  quantity: number
  price: number
  action: "refund" | "exchange" | "store_credit"
  exchange_product_id?: string
}

export interface AISuggestion {
  id: string
  return_id: string
  suggestion_type: "exchange" | "store_credit"
  suggested_product_id?: string
  suggested_product_name?: string
  confidence_score: number
  reasoning: string
  accepted: boolean | null
  created_at: string
}

export interface AnalyticsEvent {
  id: string
  merchant_id: string
  event_type: string
  event_data: Record<string, any>
  created_at: string
}

export interface BillingRecord {
  id: string
  merchant_id: string
  plan_type: "starter" | "growth" | "pro"
  usage_count: number
  stripe_customer_id: string
  current_period_start: string
  current_period_end: string
}
