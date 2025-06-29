import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export interface AIExchangeSuggestion {
  productId: string
  productName: string
  confidence: number
  reasoning: string
  suggestedAction: "exchange" | "store_credit"
}

export interface ReturnContext {
  reason: string
  productName: string
  productCategory?: string
  customerHistory?: {
    previousReturns: number
    averageOrderValue: number
  }
  availableProducts?: Array<{
    id: string
    name: string
    category: string
    price: number
    inStock: boolean
  }>
}

export class AIService {
  private static instance: AIService

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  async generateExchangeSuggestion(context: ReturnContext): Promise<AIExchangeSuggestion | null> {
    try {
      const prompt = this.buildPrompt(context)

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        temperature: 0.3, // Lower temperature for more consistent suggestions
      })

      return this.parseAIResponse(text, context)
    } catch (error) {
      console.error("AI suggestion generation failed:", error)
      return this.getFallbackSuggestion(context)
    }
  }

  private buildPrompt(context: ReturnContext): string {
    return `
You are an AI assistant for an e-commerce returns system. Your job is to suggest the best exchange option for a customer return to maximize customer satisfaction and reduce refunds.

Return Context:
- Product: ${context.productName}
- Return Reason: ${context.reason}
- Product Category: ${context.productCategory || "Unknown"}
- Customer Previous Returns: ${context.customerHistory?.previousReturns || 0}
- Customer AOV: $${context.customerHistory?.averageOrderValue || 0}

Available Alternative Products:
${context.availableProducts?.map((p) => `- ${p.name} (${p.category}) - $${p.price} - ${p.inStock ? "In Stock" : "Out of Stock"}`).join("\n") || "No alternatives provided"}

Based on the return reason and available products, suggest the best exchange option. Consider:
1. The specific reason for return (size, color, defect, etc.)
2. Product similarity and customer preferences
3. Stock availability
4. Price point compatibility

Respond in this exact JSON format:
{
  "productId": "suggested_product_id",
  "productName": "Suggested Product Name",
  "confidence": 0.85,
  "reasoning": "Clear explanation of why this suggestion makes sense",
  "suggestedAction": "exchange"
}

If no good exchange option exists, suggest store credit:
{
  "productId": null,
  "productName": null,
  "confidence": 0.60,
  "reasoning": "Explanation of why store credit is better",
  "suggestedAction": "store_credit"
}
    `.trim()
  }

  private parseAIResponse(response: string, context: ReturnContext): AIExchangeSuggestion | null {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response")
      }

      const parsed = JSON.parse(jsonMatch[0])

      // Validate the response structure
      if (!this.isValidAIResponse(parsed)) {
        throw new Error("Invalid AI response structure")
      }

      return {
        productId: parsed.productId || "",
        productName: parsed.productName || "",
        confidence: Math.min(Math.max(parsed.confidence, 0), 1), // Clamp between 0-1
        reasoning: parsed.reasoning || "AI suggestion generated",
        suggestedAction: parsed.suggestedAction || "exchange",
      }
    } catch (error) {
      console.error("Failed to parse AI response:", error)
      return this.getFallbackSuggestion(context)
    }
  }

  private isValidAIResponse(response: any): boolean {
    return (
      typeof response === "object" &&
      (response.productId === null || typeof response.productId === "string") &&
      (response.productName === null || typeof response.productName === "string") &&
      typeof response.confidence === "number" &&
      typeof response.reasoning === "string" &&
      ["exchange", "store_credit"].includes(response.suggestedAction)
    )
  }

  private getFallbackSuggestion(context: ReturnContext): AIExchangeSuggestion {
    // Rule-based fallback suggestions
    const reason = context.reason.toLowerCase()

    if (reason.includes("small") || reason.includes("tight")) {
      return {
        productId: "size_up_variant",
        productName: `${context.productName} - Larger Size`,
        confidence: 0.75,
        reasoning: "Based on size complaint, suggesting larger size of the same item.",
        suggestedAction: "exchange",
      }
    }

    if (reason.includes("large") || reason.includes("loose")) {
      return {
        productId: "size_down_variant",
        productName: `${context.productName} - Smaller Size`,
        confidence: 0.75,
        reasoning: "Based on size complaint, suggesting smaller size of the same item.",
        suggestedAction: "exchange",
      }
    }

    if (reason.includes("color") || reason.includes("colour")) {
      return {
        productId: "color_variant",
        productName: `${context.productName} - Alternative Color`,
        confidence: 0.7,
        reasoning: "Based on color preference, suggesting alternative color option.",
        suggestedAction: "exchange",
      }
    }

    if (reason.includes("defect") || reason.includes("damaged") || reason.includes("broken")) {
      return {
        productId: "same_product",
        productName: context.productName,
        confidence: 0.9,
        reasoning: "Product defect reported, suggesting replacement of the same item.",
        suggestedAction: "exchange",
      }
    }

    // Default fallback
    return {
      productId: "",
      productName: "",
      confidence: 0.5,
      reasoning: "Unable to determine best exchange option. Store credit recommended.",
      suggestedAction: "store_credit",
    }
  }

  async analyzeBulkReturns(
    returns: Array<{
      id: string
      reason: string
      productName: string
      customerEmail: string
    }>,
  ): Promise<{
    insights: string[]
    recommendations: string[]
    riskProducts: string[]
  }> {
    try {
      const prompt = `
Analyze these return patterns and provide insights:

Returns Data:
${returns.map((r) => `- ${r.productName}: "${r.reason}"`).join("\n")}

Provide analysis in this JSON format:
{
  "insights": ["Key insight 1", "Key insight 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "riskProducts": ["Product name 1", "Product name 2"]
}
      `.trim()

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        temperature: 0.2,
      })

      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error("Bulk analysis failed:", error)
    }

    return {
      insights: ["Unable to generate insights at this time"],
      recommendations: ["Review return patterns manually"],
      riskProducts: [],
    }
  }
}

export const aiService = AIService.getInstance()
