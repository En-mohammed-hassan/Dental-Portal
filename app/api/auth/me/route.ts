import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }
  const kind =
    session.role === "PATIENT" ? ("patient" as const) : ("admin" as const)
  return NextResponse.json({
    user: {
      id: session.sub,
      role: session.role,
      phone: session.phone,
      patientProfileId: session.patientProfileId ?? null,
      kind,
    },
  })
}
