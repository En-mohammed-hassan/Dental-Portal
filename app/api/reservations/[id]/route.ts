import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import {
  cancelUpcomingAdvanceReservation,
  deleteReservation,
} from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request)
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const url = new URL(request.url)
  const fromHistory = url.searchParams.get("fromHistory") === "true"

  try {
    // If fromHistory is true, use deleteReservation (allows deleting completed)
    // Otherwise use cancelUpcomingAdvanceReservation (only for upcoming/waiting)
    const data = fromHistory
      ? await deleteReservation(id)
      : await cancelUpcomingAdvanceReservation(id)
    const response = NextResponse.json({ data })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete reservation"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}
