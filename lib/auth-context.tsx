"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthUser extends User {
  merchantId?: string
  role?: "admin" | "staff"
  shopDomain?: string
}

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUserProfile = async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          merchants!inner(id, shop_domain, name)
        `)
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }

      return {
        ...session?.user,
        merchantId: data.merchant_id,
        role: data.role,
        shopDomain: data.merchants?.shop_domain,
      } as AuthUser
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      return null
    }
  }

  const refreshUser = async () => {
    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user.id)
      setUser(userProfile)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        setSession(initialSession)

        if (initialSession?.user) {
          const userProfile = await fetchUserProfile(initialSession.user.id)
          setUser(userProfile)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
        setUser(null)
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("Auth state changed:", event, newSession?.user?.email)

      setSession(newSession)

      if (newSession?.user) {
        const userProfile = await fetchUserProfile(newSession.user.id)
        setUser(userProfile)
      } else {
        setUser(null)
      }

      setLoading(false)

      // Handle navigation based on auth events
      if (event === "SIGNED_IN") {
        const redirectTo = new URLSearchParams(window.location.search).get("redirectTo")
        router.push(redirectTo || "/admin")
      } else if (event === "SIGNED_OUT") {
        router.push("/auth")
      } else if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/reset-password")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshUser }}>{children}</AuthContext.Provider>
  )
}
