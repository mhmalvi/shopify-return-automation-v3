import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return res
  }

  try {
    // Check for demo session in headers (client-side will send this)
    const demoSession = req.headers.get("x-demo-session")

    // Create Supabase client
    const supabase = createMiddlewareClient({ req, res })

    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Protected routes that require authentication
    const protectedRoutes = ["/admin", "/dashboard", "/settings"]
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

    // Auth routes that should redirect if already authenticated
    const authRoutes = ["/auth", "/login", "/signup"]
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    if (isProtectedRoute) {
      // Check for demo session or real session
      if (!session && !demoSession) {
        const redirectUrl = new URL("/auth", req.url)
        redirectUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    if (isAuthRoute && (session || demoSession)) {
      // User is already authenticated, redirect to admin
      const redirectTo = req.nextUrl.searchParams.get("redirectTo") || "/admin"
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // On error, allow the request to continue
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
