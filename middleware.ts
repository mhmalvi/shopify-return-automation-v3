import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Skip middleware for static files and API routes
  if (
    req.nextUrl.pathname.startsWith("/_next/") ||
    req.nextUrl.pathname.startsWith("/api/") ||
    req.nextUrl.pathname.includes(".")
  ) {
    return res
  }

  const supabase = createMiddlewareClient({ req, res })
  const pathname = req.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth", "/auth/reset-password"]
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  // Returns routes are public (customer-facing)
  if (pathname.startsWith("/returns/")) {
    return res
  }

  // Check for demo session in localStorage (client-side check will be done in auth context)
  // For middleware, we'll be more permissive with demo routes
  if (pathname.startsWith("/admin") && req.nextUrl.searchParams.get("demo") === "true") {
    return res
  }

  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Redirect unauthenticated users from protected routes
    if (!session && pathname.startsWith("/admin")) {
      const redirectUrl = new URL("/auth", req.url)
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth pages
    if (session && pathname.startsWith("/auth") && pathname !== "/auth/reset-password") {
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
