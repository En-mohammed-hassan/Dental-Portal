import { NextResponse } from "next/server"

import { requireStaffApi } from "@/lib/api/require-staff"
import { getScheduleDay } from "@/lib/server/schedule-service"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const denied = await requireStaffApi()
  if (denied) return denied

  const url = new URL(request.url)
  const from = new Date(url.searchParams.get("from") ?? "")
  const to = new Date(url.searchParams.get("to") ?? "")
  const rangeMs = to.getTime() - from.getTime()

  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    rangeMs <= 0 ||
    rangeMs > 26 * 60 * 60 * 1000
  ) {
    return NextResponse.json({ message: "Invalid day range" }, { status: 400 })
  }

  const reservations = await getScheduleDay(from, to)
  return NextResponse.json(
    { reservations },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  )
}
