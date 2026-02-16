import { NextResponse } from "next/server"

import {
  createPatientProfile,
  listPatients,
} from "@/lib/server/reservations-service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const search = url.searchParams.get("search") ?? undefined
  const data = await listPatients(search)
  return NextResponse.json({ data })
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
