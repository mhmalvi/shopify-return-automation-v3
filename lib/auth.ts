import { createServerClient } from "@/lib/supabase"
import type { NextRequest } from "next/server"

export interface AuthUser {
  id: string
  email: string
  merchantId: string
  role: "admin" | "staff"
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const supabase = createServerClient()

    // Get the authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)

    // Verify the JWT token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)
    if (error || !user) {
      return null
    }

    // Get user details from our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        role,
        merchant_id,
        merchants!inner(id, shop_domain)
      `)
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return null
    }

    return {
      id: userData.id,
      email: userData.email,
      merchantId: userData.merchant_id,
      role: userData.role,
    }
  } catch (error) {
    console.error("Auth verification failed:", error)
    return null
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request)

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    return handler(request, user)
  }
}

export function requireRole(role: "admin" | "staff") {
  return (handler: (request: NextRequest, user: AuthUser) => Promise<Response>) =>
    requireAuth(async (request: NextRequest, user: AuthUser) => {
      if (user.role !== role && user.role !== "admin") {
        return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      }

      return handler(request, user)
    })
}
