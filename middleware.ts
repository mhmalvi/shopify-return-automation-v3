import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Skip middleware for static files, API routes, and specific paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return res
  }

  try {
    // Create Supabase client for middleware
    const supabase = createMiddlewareClient({ req, res })

    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Define route types
    const protectedRoutes = ["/admin", "/dashboard", "/settings"]
    const authRoutes = ["/auth"]
    const publicRoutes = ["/", "/returns"]

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

    // Handle protected routes
    if (isProtectedRoute) {
      if (!session) {
        // Check for demo session (we'll handle this more gracefully)
        const redirectUrl = new URL("/auth", req.url)
        redirectUrl.searchParams.set("redirectTo", pathname)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Handle auth routes when already authenticated
    if (isAuthRoute && session && pathname !== "/auth/reset-password") {
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
