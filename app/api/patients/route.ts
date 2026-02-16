import { NextResponse } from "next/server"

import {
  createPatientProfile,
  listPatients,
} from "@/lib/server/reservations-service"

// Force dynamic rendering to prevent build-time execution
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.get("search") ?? undefined
  const data = await listPatients(search)
  return NextResponse.json(
    { data },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const data = await createPatientProfile(payload)
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create patient"
    return NextResponse.json({ message }, { status: 400 })
  }
}
