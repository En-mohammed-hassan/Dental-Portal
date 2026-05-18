import { NextResponse } from "next/server"

import { requireStaffApi } from "@/lib/api/require-staff"
import { isStatsUnlocked } from "@/lib/api/require-stats-unlock"
import { getStatsPassword } from "@/lib/auth/stats-unlock"

export const dynamic = "force-dynamic"

export async function GET() {
  const denied = await requireStaffApi()
  if (denied) return denied

  const configured = Boolean(getStatsPassword())
  const unlocked = configured ? await isStatsUnlocked() : false

  return NextResponse.json({
    data: {
      configured,
      unlocked,
    },
  })
}
