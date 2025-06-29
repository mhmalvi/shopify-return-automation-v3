"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthUser {
  id: string
  email: string
  merchantId: string
  role: "admin" | "staff"
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkDemoSession = () => {
    if (typeof window === "undefined") return null

    try {
      const demoSession = localStorage.getItem("demo_session")
      if (demoSession) {
        const session = JSON.parse(demoSession)
        if (session.expires_at > Date.now()) {
          return session.user
        } else {
          localStorage.removeItem("demo_session")
        }
      }
    } catch (error) {
      console.error("Error checking demo session:", error)
      if (typeof window !== "undefined") {
        localStorage.removeItem("demo_session")
      }
    }
    return null
  }

  const fetchUserProfile = async (authUser: User): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          id,
          email,
          role,
          merchant_id,
          merchants!inner(id, shop_domain)
        `)
        .eq("id", authUser.id)
        .single()

      if (error || !data) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        merchantId: data.merchant_id,
        role: data.role,
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  const refreshUser = async () => {
    try {
      // Check for demo session first
      const demoUser = checkDemoSession()
      if (demoUser) {
        setUser(demoUser)
        setLoading(false)
        return
      }

      // Check Supabase auth
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser()

      if (error || !authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const userProfile = await fetchUserProfile(authUser)
      setUser(userProfile)
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      // Clear demo session
      if (typeof window !== "undefined") {
        localStorage.removeItem("demo_session")
      }

      // Sign out from Supabase
      await supabase.auth.signOut()

      setUser(null)
      router.push("/auth")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    // Initial user check
    refreshUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const userProfile = await fetchUserProfile(session.user)
        setUser(userProfile)
      } else if (event === "SIGNED_OUT") {
        // Only clear user if not in demo mode
        const demoUser = checkDemoSession()
        if (!demoUser) {
          setUser(null)
        }
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
