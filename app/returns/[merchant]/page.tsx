"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, ArrowRight, Sparkles, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Merchant } from "@/lib/types"

interface OrderItem {
  id: string
  name: string
  variant_title: string
  quantity: number
  price: number
  image_url: string
}

interface Order {
  id: string
  order_number: string
  email: string
  items: OrderItem[]
  total_price: number
}

interface AISuggestionResponse {
  productId: string
  productName: string
  confidence: number
  reasoning: string
  suggestedAction: "exchange" | "store_credit"
}

export default function CustomerReturnsPortal() {
  const params = useParams()
  const { toast } = useToast()
  const merchantDomain = params.merchant as string

  const [step, setStep] = useState(1)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [returnReason, setReturnReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionResponse[]>([])
  const [selectedAction, setSelectedAction] = useState<"refund" | "exchange">("refund")
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Form data
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    loadMerchant()
  }, [merchantDomain])

  const loadMerchant = async () => {
    try {
      setLoading(true)
      setDebugInfo(`Looking up merchant: "${merchantDomain}"`)

      // Use the new API endpoint
      const response = await fetch(`/api/merchants/${merchantDomain}`)
      const result = await response.json()

      if (response.ok && result.merchant) {
        setDebugInfo((prev) => prev + `\nAPI lookup: SUCCESS`)
        setDebugInfo((prev) => prev + `\nMerchant found: ${result.merchant.shop_domain}`)
        setMerchant(result.merchant)
      } else {
        setDebugInfo((prev) => prev + `\nAPI lookup: FAILED`)
        setDebugInfo((prev) => prev + `\nError: ${result.error}`)

        if (result.debug) {
          setDebugInfo((prev) => prev + `\nSearched for: ${result.debug.searchedDomain}`)
          setDebugInfo((prev) => prev + `\nAvailable merchants: ${result.debug.availableMerchants.join(", ")}`)
        }

        toast({
          title: "Store Not Found",
          description: "The store you're looking for doesn't exist or isn't available.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setDebugInfo((prev) => prev + `\nFetch error: ${error}`)
      toast({
        title: "Error",
        description: "Failed to load store information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const lookupOrder = async () => {
    if (!orderNumber || !email) {
      toast({
        title: "Missing Information",
        description: "Please enter both order number and email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // For demo purposes, let's create a mock order if we're using demo data
      if (merchantDomain === "demo-store" && orderNumber === "12345" && email === "customer@example.com") {
        const mockOrder: Order = {
          id: "12345",
          order_number: "12345",
          email: "customer@example.com",
          total_price: 89.97,
          items: [
            {
              id: "item_1",
              name: "Premium Cotton T-Shirt",
              variant_title: "Size M / Blue",
              quantity: 1,
              price: 29.99,
              image_url: "/placeholder.svg?height=100&width=100",
            },
            {
              id: "item_2",
              name: "Denim Jeans",
              variant_title: "Size 32 / Dark Wash",
              quantity: 1,
              price: 59.99,
              image_url: "/placeholder.svg?height=100&width=100",
            },
          ],
        }

        setOrder(mockOrder)
        setStep(2)
        return
      }

      // Call the API to lookup order via Shopify
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchant_domain: merchant?.shop_domain || `${merchantDomain}.myshopify.com`,
          order_number: orderNumber.replace("#", ""),
          customer_email: email,
        }),
      })

      if (!response.ok) {
        throw new Error("Order not found")
      }

      const { order: orderData } = await response.json()

      // Transform Shopify order data to our format
      const transformedOrder: Order = {
        id: orderData.id,
        order_number: orderData.order_number || orderData.name,
        email: orderData.email,
        total_price: Number.parseFloat(orderData.total_price),
        items: orderData.line_items.map((item: any) => ({
          id: item.id,
          name: item.title,
          variant_title: item.variant_title || "",
          quantity: item.quantity,
          price: Number.parseFloat(item.price),
          image_url: item.image_url || "/placeholder.svg?height=100&width=100",
        })),
      }

      setOrder(transformedOrder)
      setStep(2)
    } catch (error) {
      toast({
        title: "Order Not Found",
        description:
          "Please check your order number and email address. For demo, try order #12345 with customer@example.com",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateAISuggestions = async () => {
    if (selectedItems.length === 0) return

    setLoading(true)
    try {
      const finalReason = returnReason === "Other" ? customReason : returnReason

      // Call AI service for suggestions
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchant_id: merchant?.id,
          reason: finalReason,
          items: selectedItems.map((itemId) => {
            const item = order?.items.find((i) => i.id === itemId)
            return {
              product_id: itemId,
              product_name: item?.name,
              price: item?.price,
              quantity: item?.quantity,
            }
          }),
        }),
      })

      if (response.ok) {
        const { suggestions } = await response.json()
        setAiSuggestions(suggestions || [])
      }

      setStep(3)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      })
      setStep(3) // Continue anyway
    } finally {
      setLoading(false)
    }
  }

  const submitReturn = async () => {
    if (!order || !merchant) return

    setSubmitLoading(true)
    try {
      const finalReason = returnReason === "Other" ? customReason : returnReason

      const returnData = {
        merchant_domain: merchant.shop_domain,
        order_number: order.order_number,
        customer_email: email,
        reason: finalReason,
        items: selectedItems.map((itemId) => {
          const item = order.items.find((i) => i.id === itemId)!
          return {
            product_id: itemId,
            product_name: item.name,
            variant_id: item.id, // Using item ID as variant ID for demo
            quantity: item.quantity,
            price: item.price,
            action: selectedAction,
            exchange_product_id:
              selectedAction === "exchange" && aiSuggestions.length > 0 ? aiSuggestions[0].productId : null,
          }
        }),
      }

      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(returnData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit return")
      }

      const result = await response.json()

      toast({
        title: "Return Submitted Successfully!",
        description: "You'll receive an email confirmation shortly with next steps.",
      })

      setStep(4)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit return request",
        variant: "destructive",
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const returnReasons = [
    "Item too small",
    "Item too large",
    "Wrong color/style",
    "Defective/damaged",
    "Not as described",
    "Changed my mind",
    "Other",
  ]

  if (loading && !merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading store information...</span>
        </div>
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Store Not Found</h2>
              <p className="text-gray-600 mb-4">The store you're looking for doesn't exist or isn't available.</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">Demo Instructions:</h3>
                <p className="text-sm text-blue-800 mb-2">
                  To try the demo, make sure you've run the database setup scripts first, then visit:
                </p>
                <code className="block mt-2 p-2 bg-blue-100 rounded text-sm">/returns/demo-store</code>
                <p className="text-xs text-blue-700 mt-2">
                  If you're still seeing this error, check the browser console for more details.
                </p>
              </div>

              <details className="text-left mt-4">
                <summary className="cursor-pointer text-sm font-medium">Debug Information</summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto whitespace-pre-wrap">
                  {debugInfo || "No debug information available"}
                </pre>
              </details>

              <Button onClick={loadMerchant} className="mt-4 bg-transparent" variant="outline">
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with merchant branding */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {merchant.settings.logo_url && (
              <img src={merchant.settings.logo_url || "/placeholder.svg"} alt="Store Logo" className="h-8 w-auto" />
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Returns Portal</h1>
              <p className="text-sm text-gray-500">{merchant.shop_domain}</p>
            </div>
          </div>
          <Badge variant="outline">Secure</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNum ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 4 && <div className={`w-16 h-1 mx-2 ${step > stepNum ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Order Lookup</span>
            <span>Select Items</span>
            <span>Choose Action</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Step 1: Order Lookup */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Find Your Order</CardTitle>
              <CardDescription>Enter your order number and email to get started with your return</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-green-900 mb-2">✅ Store Connected Successfully!</h3>
                <p className="text-sm text-green-800 mb-2">
                  You're now connected to <strong>{merchant.shop_domain}</strong>
                </p>
                <div className="text-xs text-green-700">
                  Plan: {merchant.plan_type} | Store ID: {merchant.id.slice(0, 8)}...
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-blue-900 mb-2">Demo Credentials:</h3>
                <p className="text-sm text-blue-800 mb-2">Use these credentials to try the demo:</p>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Order Number:</strong> 12345
                  </div>
                  <div>
                    <strong>Email:</strong> customer@example.com
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="orderNumber">Order Number</Label>
                <Input
                  id="orderNumber"
                  placeholder="e.g., #1001 or 1001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={lookupOrder} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Looking up order...
                  </>
                ) : (
                  <>
                    Find Order
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Items */}
        {step === 2 && order && (
          <Card>
            <CardHeader>
              <CardTitle>Select Items to Return</CardTitle>
              <CardDescription>
                Choose which items you'd like to return from order #{order.order_number}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item.id])
                        } else {
                          setSelectedItems(selectedItems.filter((id) => id !== item.id))
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <img
                      src={item.image_url || "/placeholder.svg"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.variant_title}</p>
                      <p className="text-sm font-medium">${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label htmlFor="reason">Reason for Return</Label>
                <RadioGroup value={returnReason} onValueChange={setReturnReason}>
                  {returnReasons.map((reason) => (
                    <div key={reason} className="flex items-center space-x-2">
                      <RadioGroupItem value={reason} id={reason} />
                      <Label htmlFor={reason}>{reason}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {returnReason === "Other" && (
                <div>
                  <Label htmlFor="customReason">Please describe the reason</Label>
                  <Textarea
                    id="customReason"
                    placeholder="Please describe the reason for your return..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="mt-2"
                  />
                </div>
              )}

              <Button
                onClick={generateAISuggestions}
                disabled={
                  selectedItems.length === 0 || !returnReason || (returnReason === "Other" && !customReason) || loading
                }
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: AI Suggestions */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                Smart Recommendations
              </CardTitle>
              <CardDescription>
                Based on your return reason, we have some suggestions that might work better for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={selectedAction} onValueChange={setSelectedAction as any}>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="refund" id="refund" />
                    <div className="flex-1">
                      <Label htmlFor="refund" className="font-medium">
                        Full Refund
                      </Label>
                      <p className="text-sm text-gray-500">Get your money back</p>
                    </div>
                  </div>

                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-4 border rounded-lg bg-blue-50 border-blue-200"
                    >
                      <RadioGroupItem value="exchange" id="exchange" />
                      <div className="flex-1">
                        <Label htmlFor="exchange" className="font-medium flex items-center">
                          <Sparkles className="w-4 h-4 mr-1 text-blue-600" />
                          Smart Exchange Suggestion
                          <Badge variant="secondary" className="ml-2">
                            {Math.round(suggestion.confidence * 100)}% match
                          </Badge>
                        </Label>
                        <p className="text-sm text-gray-700 mt-1">{suggestion.productName}</p>
                        <p className="text-xs text-gray-600 mt-1">{suggestion.reasoning}</p>
                      </div>
                    </div>
                  ))}

                  {aiSuggestions.length === 0 && (
                    <div className="flex items-center space-x-2 p-4 border rounded-lg bg-gray-50">
                      <RadioGroupItem value="exchange" id="exchange" disabled />
                      <div className="flex-1">
                        <Label htmlFor="exchange" className="font-medium text-gray-500">
                          Exchange Option
                        </Label>
                        <p className="text-sm text-gray-500">No suitable exchange options available</p>
                      </div>
                    </div>
                  )}
                </div>
              </RadioGroup>

              <Separator />

              <Button onClick={submitReturn} disabled={submitLoading} className="w-full">
                {submitLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit {selectedAction === "refund" ? "Refund" : "Exchange"} Request
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <Card>
            <CardContent className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Return Submitted Successfully!</h2>
              <p className="text-gray-600 mb-6">
                We've received your return request and will process it within 1-2 business days.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium mb-2">What happens next?</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• You'll receive an email confirmation shortly</p>
                  <p>• We'll review your request within 24 hours</p>
                  <p>• You'll get return shipping instructions via email</p>
                  <p>• Processing takes 3-5 business days after we receive your item</p>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>Questions? Contact us at support@{merchant.shop_domain}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
