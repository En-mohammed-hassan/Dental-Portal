import { NextResponse } from "next/server"

import {
  cancelUpcomingAdvanceReservation,
  deleteReservation,
} from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

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
    return NextResponse.json({ data })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete reservation"
    return NextResponse.json({ message }, { status: 400 })
  }
}
