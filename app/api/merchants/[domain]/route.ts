import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { domain: string } }) {
  try {
    const domain = params.domain
    console.log(`[API] Looking up merchant for domain: "${domain}"`)

    const supabase = createServerClient()

    // Normalize domain
    let fullDomain = domain.trim().toLowerCase()
    if (!fullDomain.endsWith(".myshopify.com")) {
      fullDomain = `${fullDomain}.myshopify.com`
    }

    console.log(`[API] Normalized domain: "${fullDomain}"`)

    // Try exact match first
    const { data: merchant, error } = await supabase
      .from("merchants")
      .select("*")
      .eq("shop_domain", fullDomain)
      .maybeSingle()

    if (error) {
      console.error(`[API] Database error:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!merchant) {
      console.log(`[API] No merchant found for domain: ${fullDomain}`)

      // For debugging, let's also check what merchants exist
      const { data: allMerchants } = await supabase.from("merchants").select("shop_domain").limit(10)

      console.log(
        `[API] Available merchants:`,
        allMerchants?.map((m) => m.shop_domain),
      )

      return NextResponse.json(
        {
          error: "Merchant not found",
          debug: {
            searchedDomain: fullDomain,
            availableMerchants: allMerchants?.map((m) => m.shop_domain) || [],
          },
        },
        { status: 404 },
      )
    }

    console.log(`[API] Found merchant:`, merchant.shop_domain)

    return NextResponse.json({ merchant })
  } catch (error) {
    console.error(`[API] Merchant lookup error:`, error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
