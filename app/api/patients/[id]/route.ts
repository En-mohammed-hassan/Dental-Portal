import { NextResponse } from "next/server"

import {
  deletePatientProfile,
  updatePatientProfile,
} from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const payload = await request.json()
    const data = await updatePatientProfile(id, payload)
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update patient"
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    await deletePatientProfile(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete patient"
    return NextResponse.json({ message }, { status: 400 })
  }
}
