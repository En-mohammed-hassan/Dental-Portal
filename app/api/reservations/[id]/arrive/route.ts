import { NextResponse } from "next/server"

import { markAsArrived } from "@/lib/server/reservations-service"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  try {
    const data = await markAsArrived(id)
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark as arrived"
    return NextResponse.json({ message }, { status: 400 })
  }
}
