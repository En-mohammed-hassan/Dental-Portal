import { NextResponse } from "next/server"

import { requireStaffApi } from "@/lib/api/require-staff"
import { resolveReminder } from "@/lib/server/reminders-service"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const denied = await requireStaffApi()
  if (denied) return denied
  try {
    const { id } = await context.params
    await resolveReminder(id, await request.json())
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update reminder"
    return NextResponse.json({ message }, { status: 400 })
  }
}
