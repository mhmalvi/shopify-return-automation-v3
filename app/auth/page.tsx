"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function AuthPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    shopDomain: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "signup") {
        // Sign up new merchant
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              shop_domain: formData.shopDomain,
            },
          },
        })

        if (error) throw error

        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        })
      } else {
        // Sign in existing merchant
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        })

        if (error) throw error

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        })

        router.push("/admin")
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleShopifyInstall = () => {
    // In a real app, this would redirect to Shopify OAuth
    const shopifyAuthUrl =
      `https://${formData.shopDomain}/admin/oauth/authorize?` +
      `client_id=${process.env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID}&` +
      `scope=read_orders,write_orders,read_products&` +
      `redirect_uri=${encodeURIComponent(window.location.origin + "/auth/shopify/callback")}&` +
      `state=${Math.random().toString(36).substring(7)}`

    window.location.href = shopifyAuthUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Returns Automation</span>
          </div>
          <p className="text-gray-600">Sign in to manage your returns</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "signin" ? "Sign In" : "Create Account"}</CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Enter your credentials to access your dashboard"
                : "Set up your returns automation account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="shopDomain">Shopify Store Domain</Label>
                  <Input
                    id="shopDomain"
                    type="text"
                    placeholder="your-store.myshopify.com"
                    value={formData.shopDomain}
                    onChange={(e) => setFormData((prev) => ({ ...prev, shopDomain: e.target.value }))}
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "signin" && (
                    <Link href="/auth/reset-password" className="text-sm text-blue-600 hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 bg-transparent"
                onClick={handleShopifyInstall}
                disabled={!formData.shopDomain && mode === "signup"}
              >
                Install Shopify App
              </Button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="text-sm text-blue-600 hover:underline"
              >
                {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Access */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                <strong>Demo Access:</strong> Use email "admin@demo-store.com" and password "demo123" to try the
                platform.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
