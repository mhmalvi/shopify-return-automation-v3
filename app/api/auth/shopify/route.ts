import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const shop = searchParams.get("shop")

  if (!shop) {
    return NextResponse.json({ error: "Shop parameter required" }, { status: 400 })
  }

  // Validate shop domain
  if (!shop.endsWith(".myshopify.com")) {
    return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 })
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback`
  const scopes = "read_orders,write_orders,read_products,write_products"
  const state = Math.random().toString(36).substring(7)

  // Store state in session/database for verification
  const authUrl =
    `https://${shop}/admin/oauth/authorize?` +
    `client_id=${clientId}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`

  return NextResponse.redirect(authUrl)
}
