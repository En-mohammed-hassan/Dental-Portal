import { NextResponse } from "next/server"

import { addCorsHeaders, handleCorsPreflight } from "@/lib/api/cors"
import { markAsArrived } from "@/lib/server/reservations-service"

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

  try {
    const data = await markAsArrived(id)
    const response = NextResponse.json({ data })
    return addCorsHeaders(response, request)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mark as arrived"
    const response = NextResponse.json({ message }, { status: 400 })
    return addCorsHeaders(response, request)
  }
}
