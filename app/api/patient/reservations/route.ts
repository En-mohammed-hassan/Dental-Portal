import { NextResponse } from "next/server"
import { z } from "zod"

import { getSession } from "@/lib/auth/session"
import { addReservation, listReservationsForPatient } from "@/lib/server/reservations-service"

export const dynamic = "force-dynamic"

const bookSchema = z.object({
  slotId: z.string().min(1),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "PATIENT" || !session.patientProfileId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    const data = await listReservationsForPatient(session.patientProfileId)
    return NextResponse.json({ data })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load appointments"
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== "PATIENT" || !session.patientProfileId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const json = await request.json().catch(() => ({}))
    const parsed = bookSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ message: "Select a time slot" }, { status: 400 })
    }

    const data = await addReservation({
      patientId: session.patientProfileId,
      bookingType: "advance",
      appointmentDate: new Date().toISOString(),
      slotId: parsed.data.slotId,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Booking failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}
