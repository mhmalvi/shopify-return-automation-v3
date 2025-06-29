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

  // Check for demo session in cookies or headers
  const demoSession = req.cookies.get("demo_session")?.value
  let isDemoUser = false

  if (demoSession) {
    try {
      const session = JSON.parse(demoSession)
      isDemoUser = session.expires_at > Date.now()
    } catch (error) {
      // Invalid demo session, ignore
    }
  }

  // Create Supabase client
  const supabase = createMiddlewareClient({ req, res })

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthenticated = session?.user || isDemoUser

  // Protected routes that require authentication
  const protectedRoutes = ["/admin"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Auth routes that should redirect if already authenticated
  const authRoutes = ["/auth"]
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to auth with return URL
    const redirectUrl = new URL("/auth", req.url)
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    const redirectTo = req.nextUrl.searchParams.get("redirectTo") || "/admin"
    return NextResponse.redirect(new URL(redirectTo, req.url))
  }

  return res
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
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}
