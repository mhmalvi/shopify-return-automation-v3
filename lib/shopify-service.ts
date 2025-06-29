export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  product_type: string
  vendor: string
  variants: ShopifyVariant[]
  images: Array<{
    id: string
    src: string
    alt?: string
  }>
  status: string
}

export interface ShopifyVariant {
  id: string
  product_id: string
  title: string
  price: string
  sku?: string
  inventory_quantity: number
  option1?: string
  option2?: string
  option3?: string
}

export interface ShopifyOrder {
  id: string
  order_number: string
  email: string
  total_price: string
  line_items: Array<{
    id: string
    product_id: string
    variant_id: string
    title: string
    variant_title?: string
    quantity: number
    price: string
  }>
  customer: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  created_at: string
}

export class ShopifyService {
  private baseUrl: string
  private accessToken: string

  constructor(shopDomain: string, accessToken: string) {
    this.baseUrl = `https://${shopDomain}/admin/api/2023-10/`
    this.accessToken = accessToken
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Shopify API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  async getOrder(orderId: string): Promise<ShopifyOrder | null> {
    try {
      const data = await this.makeRequest(`orders/${orderId}.json`)
      return data.order
    } catch (error) {
      console.error("Failed to fetch order:", error)
      return null
    }
  }

  async findOrderByNumber(orderNumber: string, email: string): Promise<ShopifyOrder | null> {
    try {
      // Remove # from order number if present
      const cleanOrderNumber = orderNumber.replace("#", "")

      const data = await this.makeRequest(
        `orders.json?name=${encodeURIComponent(cleanOrderNumber)}&email=${encodeURIComponent(email)}&limit=1`,
      )

      return data.orders?.[0] || null
    } catch (error) {
      console.error("Failed to find order:", error)
      return null
    }
  }

  async getProduct(productId: string): Promise<ShopifyProduct | null> {
    try {
      const data = await this.makeRequest(`products/${productId}.json`)
      return data.product
    } catch (error) {
      console.error("Failed to fetch product:", error)
      return null
    }
  }

  async getVariant(variantId: string): Promise<ShopifyVariant | null> {
    try {
      const data = await this.makeRequest(`variants/${variantId}.json`)
      return data.variant
    } catch (error) {
      console.error("Failed to fetch variant:", error)
      return null
    }
  }

  async searchProducts(query: string, limit = 10): Promise<ShopifyProduct[]> {
    try {
      const data = await this.makeRequest(
        `products.json?title=${encodeURIComponent(query)}&limit=${limit}&status=active`,
      )
      return data.products || []
    } catch (error) {
      console.error("Failed to search products:", error)
      return []
    }
  }

  async getSimilarProducts(productId: string, productType?: string): Promise<ShopifyProduct[]> {
    try {
      let endpoint = "products.json?status=active&limit=5"

      if (productType) {
        endpoint += `&product_type=${encodeURIComponent(productType)}`
      }

      const data = await this.makeRequest(endpoint)

      // Filter out the original product
      return (data.products || []).filter((p: ShopifyProduct) => p.id !== productId)
    } catch (error) {
      console.error("Failed to fetch similar products:", error)
      return []
    }
  }

  async createRefund(
    orderId: string,
    lineItems: Array<{
      line_item_id: string
      quantity: number
      restock_type?: "no_restock" | "cancel" | "return"
    }>,
  ): Promise<any> {
    try {
      const refundData = {
        refund: {
          refund_line_items: lineItems.map((item) => ({
            line_item_id: item.line_item_id,
            quantity: item.quantity,
            restock_type: item.restock_type || "return",
          })),
          notify: true, // Send notification to customer
        },
      }

      const data = await this.makeRequest(`orders/${orderId}/refunds.json`, {
        method: "POST",
        body: JSON.stringify(refundData),
      })

      return data.refund
    } catch (error) {
      console.error("Failed to create refund:", error)
      throw error
    }
  }

  async updateOrderTags(orderId: string, tags: string[]): Promise<void> {
    try {
      const orderData = {
        order: {
          id: orderId,
          tags: tags.join(", "),
        },
      }

      await this.makeRequest(`orders/${orderId}.json`, {
        method: "PUT",
        body: JSON.stringify(orderData),
      })
    } catch (error) {
      console.error("Failed to update order tags:", error)
      throw error
    }
  }

  async getWebhooks(): Promise<any[]> {
    try {
      const data = await this.makeRequest("webhooks.json")
      return data.webhooks || []
    } catch (error) {
      console.error("Failed to fetch webhooks:", error)
      return []
    }
  }

  async createWebhook(topic: string, address: string): Promise<any> {
    try {
      const webhookData = {
        webhook: {
          topic,
          address,
          format: "json",
        },
      }

      const data = await this.makeRequest("webhooks.json", {
        method: "POST",
        body: JSON.stringify(webhookData),
      })

      return data.webhook
    } catch (error) {
      console.error("Failed to create webhook:", error)
      throw error
    }
  }

  // Utility method to get shop info
  async getShopInfo(): Promise<any> {
    try {
      const data = await this.makeRequest("shop.json")
      return data.shop
    } catch (error) {
      console.error("Failed to fetch shop info:", error)
      return null
    }
  }
}

// Factory function to create Shopify service instances
export function createShopifyService(shopDomain: string, accessToken: string): ShopifyService {
  return new ShopifyService(shopDomain, accessToken)
}

// Helper function to validate Shopify webhook
export function verifyShopifyWebhook(data: string, signature: string, secret: string): boolean {
  const crypto = require("crypto")
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(data, "utf8")
  const hash = hmac.digest("base64")

  return hash === signature
}
