import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import { requireStaffApi } from "@/lib/api/require-staff"
import {
  deletePatientProfile,
  getPatientProfile,
  updatePatientProfile,
} from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const denied = await requireStaffApi()
    if (denied) {
      return addCorsHeaders(denied, request)
    }
    const data = await getPatientProfile(id)
    const response = NextResponse.json(
      { data },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    )
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load patient"
    const status = message === "Patient not found" ? 404 : 400
    const response = NextResponse.json({ message }, { status })
    return addCorsHeaders(response, request)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const denied = await requireStaffApi()
    if (denied) {
      return addCorsHeaders(denied, request)
    }
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
    const denied = await requireStaffApi()
    if (denied) {
      return addCorsHeaders(denied, request)
    }
    await deletePatientProfile(id)
    const response = NextResponse.json({ success: true })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete patient"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}
