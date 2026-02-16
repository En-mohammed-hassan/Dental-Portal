import { NextResponse } from "next/server"

import { addReservation, getReservations } from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

export async function GET() {
  const data = await getReservations()
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const data = await addReservation(payload)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add reservation"
    return NextResponse.json({ message }, { status: 400 })
  }
}
