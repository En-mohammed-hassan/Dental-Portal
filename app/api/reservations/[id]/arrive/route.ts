import { NextResponse } from "next/server"

import { markAsArrived } from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

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
