import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const shop = searchParams.get("shop")
    const state = searchParams.get("state")

    if (!code || !shop) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Get shop information
    const shopResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
      },
    })

    if (!shopResponse.ok) {
      throw new Error("Failed to fetch shop information")
    }

    const shopData = await shopResponse.json()
    const shopInfo = shopData.shop

    // Store merchant in database
    const supabase = createServerClient()
    const { data: merchant, error } = await supabase
      .from("merchants")
      .upsert({
        shop_domain: shop,
        access_token: accessToken,
        settings: {
          shop_name: shopInfo.name,
          email: shopInfo.email,
          currency: shopInfo.currency,
          timezone: shopInfo.timezone,
          plan_name: shopInfo.plan_name,
        },
        plan_type: "starter",
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save merchant data" }, { status: 500 })
    }

    // Create webhooks
    await createShopifyWebhooks(shop, accessToken)

    // Redirect to success page
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin?installed=true`)
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.json({ error: "Installation failed" }, { status: 500 })
  }
}

async function createShopifyWebhooks(shop: string, accessToken: string) {
  const webhooks = [
    {
      topic: "orders/updated",
      address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`,
      format: "json",
    },
    {
      topic: "orders/cancelled",
      address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`,
      format: "json",
    },
    {
      topic: "refunds/create",
      address: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify`,
      format: "json",
    },
  ]

  for (const webhook of webhooks) {
    try {
      await fetch(`https://${shop}/admin/api/2023-10/webhooks.json`, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webhook }),
      })
    } catch (error) {
      console.error("Failed to create webhook:", webhook.topic, error)
    }
  }
}
