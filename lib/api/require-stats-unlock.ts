import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { STATS_UNLOCK_COOKIE, verifyStatsUnlockToken } from "@/lib/auth/stats-unlock"

export async function isStatsUnlocked(): Promise<boolean> {
  const jar = await cookies()
  const token = jar.get(STATS_UNLOCK_COOKIE)?.value
  if (!token) return false
  return verifyStatsUnlockToken(token)
}

export async function requireStatsUnlockApi(): Promise<NextResponse | null> {
  const unlocked = await isStatsUnlocked()
  if (!unlocked) {
    return NextResponse.json({ message: "Stats locked", code: "STATS_LOCKED" }, { status: 403 })
  }
  return null
}
