import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import {
  deletePatientProfile,
  updatePatientProfile,
} from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const payload = await request.json()
    const data = await updatePatientProfile(id, payload)
    const response = NextResponse.json({ data })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update patient"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    await deletePatientProfile(id)
    const response = NextResponse.json({ success: true })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete patient"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}
