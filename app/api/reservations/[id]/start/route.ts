import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import { startTreatment } from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const payload = (await request.json().catch(() => ({}))) as {
    replaceCurrent?: boolean
  }

  try {
    const data = await startTreatment(id, Boolean(payload.replaceCurrent))
    const response = NextResponse.json({ data })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start treatment"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}
