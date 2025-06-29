import { type NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"
import { createShopifyService } from "@/lib/shopify-service"
import { dataService } from "@/lib/data-service"

export async function POST(request: NextRequest) {
  try {
    const { merchant_id, reason, items } = await request.json()

    if (!merchant_id || !reason || !items?.length) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get merchant data
    const merchant = await dataService.getMerchant(merchant_id)
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }

    const suggestions = []

    // Generate AI suggestions for each item
    for (const item of items) {
      try {
        const shopifyService = createShopifyService(merchant.shop_domain, merchant.access_token)

        // Get product details
        const product = await shopifyService.getProduct(item.product_id)
        const similarProducts = await shopifyService.getSimilarProducts(item.product_id, product?.product_type)

        // Generate AI suggestion
        const aiSuggestion = await aiService.generateExchangeSuggestion({
          reason,
          productName: item.product_name,
          productCategory: product?.product_type,
          availableProducts: similarProducts.map((p) => ({
            id: p.id,
            name: p.title,
            category: p.product_type,
            price: Number.parseFloat(p.variants[0]?.price || "0"),
            inStock: (p.variants[0]?.inventory_quantity || 0) > 0,
          })),
        })

        if (aiSuggestion && aiSuggestion.confidence > 0.5) {
          suggestions.push({
            productId: aiSuggestion.productId,
            productName: aiSuggestion.productName,
            confidence: aiSuggestion.confidence,
            reasoning: aiSuggestion.reasoning,
            suggestedAction: aiSuggestion.suggestedAction,
          })
        }
      } catch (error) {
        console.error("Failed to generate suggestion for item:", item.product_id, error)
        // Continue with other items
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("AI suggestions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
