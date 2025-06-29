import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Single instance to prevent multiple GoTrueClient warnings
let clientInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (typeof window === "undefined") {
    // Server-side: create new instance
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  // Client-side: use singleton
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: "sb-returns-auth",
      },
    })
  }
  return clientInstance
})()

// Database types
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
