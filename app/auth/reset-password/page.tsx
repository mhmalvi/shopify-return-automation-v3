"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"request" | "reset">("request")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    // Check if we have a reset token in the URL
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")
    const type = searchParams.get("type")

    if (accessToken && refreshToken && type === "recovery") {
      setMode("reset")
      // Set the session with the tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }, [searchParams])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setEmailSent(true)
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      })

      // Redirect to login page
      setTimeout(() => {
        router.push("/auth")
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
          <p className="text-gray-600">{mode === "request" ? "Reset your password" : "Set your new password"}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === "request" ? "Forgot Password" : "Reset Password"}</CardTitle>
            <CardDescription>
              {mode === "request"
                ? "Enter your email address and we'll send you a reset link"
                : "Enter your new password below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent && mode === "request" ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Check your email</h3>
                  <p className="text-gray-600 mt-2">
                    We've sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <div className="pt-4">
                  <Link href="/auth">
                    <Button variant="outline" className="w-full bg-transparent">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            ) : mode === "request" ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Reset Link
                </Button>

                <div className="text-center">
                  <Link href="/auth" className="text-sm text-blue-600 hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {password && confirmPassword && password !== confirmPassword && (
                  <Alert variant="destructive">
                    <AlertDescription>Passwords do not match</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || password !== confirmPassword || password.length < 6}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
