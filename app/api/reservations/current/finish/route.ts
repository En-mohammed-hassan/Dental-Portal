import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import { requireStaffApi } from "@/lib/api/require-staff"
import { finishTreatment } from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request)
}

export async function POST(request: Request) {
  try {
    const denied = await requireStaffApi()
    if (denied) {
      return addCorsHeaders(denied, request)
    }
    const payload = (await request.json().catch(() => ({}))) as {
      treatmentNote?: string
      xrayImageBase64?: string | null
      feeCents?: number | null
      paymentStatus?: "unpaid" | "partial" | "paid" | null
      canalsCount?: number | null
      teethTreated?: string[] | null
      procedureSummary?: string | null
    }

    const data = await finishTreatment({
      treatmentNote: payload.treatmentNote ?? "",
      xrayImageBase64: payload.xrayImageBase64 ?? null,
      feeCents: payload.feeCents ?? null,
      paymentStatus: payload.paymentStatus ?? null,
      canalsCount: payload.canalsCount ?? null,
      teethTreated: payload.teethTreated ?? null,
      procedureSummary: payload.procedureSummary ?? null,
    })
    const response = NextResponse.json({ data })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finish treatment"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}
