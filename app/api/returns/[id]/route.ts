import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()
    const body = await request.json()
    const { status, merchant_id } = body
    const returnId = params.id

    // Update return status
    const { data: updatedReturn, error } = await supabase
      .from("returns")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", returnId)
      .eq("merchant_id", merchant_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log analytics event
    await supabase.from("analytics_events").insert({
      merchant_id,
      event_type: "return_status_updated",
      event_data: {
        return_id: returnId,
        old_status: updatedReturn.status,
        new_status: status,
      },
    })

    // If approved, trigger notification workflow (would be handled by n8n in real app)
    if (status === "approved") {
      // Send customer notification email
      console.log(`Sending approval notification for return ${returnId}`)
    }

    return NextResponse.json({
      success: true,
      return: updatedReturn,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
