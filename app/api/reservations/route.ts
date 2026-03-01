import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import { addReservation, getReservations } from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request)
}

export async function GET(request: Request) {
  const data = await getReservations()
  const response = NextResponse.json(
    { data },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
  return addCorsHeaders(response, request)
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const data = await addReservation(payload)
    const response = NextResponse.json({ data }, { status: 201 })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add reservation"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}
