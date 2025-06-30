
export interface Merchant {
  id: string
  shop_domain: string
  access_token?: string
  plan_type: string
  settings: {
    logo_url?: string
    brand_color?: string
    return_window_days: number
    auto_approve_exchanges: boolean
    require_return_reason: boolean
  }
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  title: string
  handle: string
  description: string
  vendor: string
  product_type: string
  tags: string[]
  variants: ProductVariant[]
  images: ProductImage[]
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  title: string
  price: number
  compare_at_price?: number
  sku?: string
  inventory_quantity: number
  weight?: number
  weight_unit?: string
}

export interface ProductImage {
  id: string
  product_id: string
  src: string
  alt?: string
  position: number
}

export interface Order {
  id: string
  order_number: string
  email: string
  total_price: number
  created_at: string
  line_items: OrderLineItem[]
}

export interface OrderLineItem {
  id: string
  product_id: string
  variant_id: string
  title: string
  variant_title?: string
  quantity: number
  price: number
}

export interface Return {
  id: string
  merchant_id: string
  order_id: string
  order_number: string
  customer_email: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  items: ReturnItem[]
  created_at: string
  updated_at: string
  shopify_order_id: string
  total_amount: number
}

export interface ReturnItem {
  id: string
  return_id: string
  product_id: string
  variant_id: string
  product_name: string
  variant_title?: string
  quantity: number
  price: number
  action: 'refund' | 'exchange'
  exchange_product_id?: string
}
