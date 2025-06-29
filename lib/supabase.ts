import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Client-side Supabase client (singleton pattern)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Server-side Supabase client for components
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// Client-side Supabase client for components
export const createClientClient = () => {
  return createClientComponentClient()
}

// Database types (you can generate these with `supabase gen types typescript`)
export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string
          shop_domain: string
          name: string
          access_token: string | null
          webhook_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_domain: string
          name: string
          access_token?: string | null
          webhook_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_domain?: string
          name?: string
          access_token?: string | null
          webhook_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          merchant_id: string
          role: "admin" | "staff"
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          merchant_id: string
          role?: "admin" | "staff"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          merchant_id?: string
          role?: "admin" | "staff"
          created_at?: string
          updated_at?: string
        }
      }
      returns: {
        Row: {
          id: string
          merchant_id: string
          order_id: string
          customer_email: string
          status: "pending" | "approved" | "rejected" | "processing" | "completed"
          reason: string
          items: any[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_id: string
          order_id: string
          customer_email: string
          status?: "pending" | "approved" | "rejected" | "processing" | "completed"
          reason: string
          items: any[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_id?: string
          order_id?: string
          customer_email?: string
          status?: "pending" | "approved" | "rejected" | "processing" | "completed"
          reason?: string
          items?: any[]
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
