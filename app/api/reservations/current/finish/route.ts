import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import { finishTreatment } from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request)
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      treatmentNote?: string
      xrayImageBase64?: string | null
    }

    const data = await finishTreatment(
      payload.treatmentNote ?? "",
      payload.xrayImageBase64 ?? null
    )
    const response = NextResponse.json({ data })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finish treatment"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}
