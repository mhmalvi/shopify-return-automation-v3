import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a single instance for client-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Create server client for API routes
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}
