import { NextResponse } from "next/server"

import { requireStaffApi } from "@/lib/api/require-staff"
import { requireStatsUnlockApi } from "@/lib/api/require-stats-unlock"
import { getAdminStats, type StatsPeriod } from "@/lib/server/stats-service"

export const dynamic = "force-dynamic"

function parsePeriod(value: string | null): StatsPeriod {
  if (value === "week" || value === "month" || value === "year") return value
  return "month"
}

export async function GET(request: Request) {
  const denied = await requireStaffApi()
  if (denied) return denied

  const locked = await requireStatsUnlockApi()
  if (locked) return locked

  const url = new URL(request.url)
  const period = parsePeriod(url.searchParams.get("period"))

  try {
    const data = await getAdminStats(period)
    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load stats"
    return NextResponse.json({ message }, { status: 500 })
  }
}
