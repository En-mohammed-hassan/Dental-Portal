import { NextResponse } from "next/server"

import { requireStaffApi } from "@/lib/api/require-staff"
import { getScheduleMonth } from "@/lib/server/schedule-service"

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
    rangeMs > 40 * 24 * 60 * 60 * 1000
  ) {
    return NextResponse.json({ message: "Invalid month range" }, { status: 400 })
  }

  const days = await getScheduleMonth(from, to)
  return NextResponse.json(
    { days },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  )
}
