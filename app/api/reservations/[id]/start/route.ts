import { NextResponse } from "next/server"

import { startTreatment } from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const payload = (await request.json().catch(() => ({}))) as {
    replaceCurrent?: boolean
  }

  try {
    const data = await startTreatment(id, Boolean(payload.replaceCurrent))
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start treatment"
    return NextResponse.json({ message }, { status: 400 })
  }
}
