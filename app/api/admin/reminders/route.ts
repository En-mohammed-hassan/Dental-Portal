import { NextResponse } from "next/server"

import { requireStaffApi } from "@/lib/api/require-staff"
import {
  createReminder,
  listLaserPatientsForDay,
  listReminders,
  syncLaserPatientReminders,
} from "@/lib/server/reminders-service"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const denied = await requireStaffApi()
  if (denied) return denied
  const date = new URL(request.url).searchParams.get("date") ?? ""
  try {
    const url = new URL(request.url)
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")
    const reminderDueOn = url.searchParams.get("reminderDueOn")
    const laserPatients =
      from && to && reminderDueOn
        ? await listLaserPatientsForDay({ from, to, reminderDueOn })
        : []
    return NextResponse.json(
      { data: await listReminders(date), laserPatients },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load reminders"
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  const denied = await requireStaffApi()
  if (denied) return denied
  try {
    await syncLaserPatientReminders(await request.json())
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save laser reminders"
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function POST(request: Request) {
  const denied = await requireStaffApi()
  if (denied) return denied
  try {
    const data = await createReminder(await request.json())
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create reminder"
    return NextResponse.json({ message }, { status: 400 })
  }
}
