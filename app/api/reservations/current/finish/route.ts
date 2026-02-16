import { NextResponse } from "next/server"

import { finishTreatment } from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      treatmentNote?: string
      xrayImageBase64?: string | null
    }

    const data = await finishTreatment(
      payload.treatmentNote ?? "",
      payload.xrayImageBase64 ?? null
    )
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to finish treatment"
    return NextResponse.json({ message }, { status: 400 })
  }
}
