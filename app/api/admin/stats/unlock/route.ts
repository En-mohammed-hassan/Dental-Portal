import { NextResponse } from "next/server"

import { requireStaffApi } from "@/lib/api/require-staff"
import { getSession } from "@/lib/auth/session"
import {
  getStatsPassword,
  signStatsUnlockToken,
  STATS_UNLOCK_COOKIE,
  statsUnlockCookieOptions,
  verifyStatsPassword,
} from "@/lib/auth/stats-unlock"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const denied = await requireStaffApi()
  if (denied) return denied

  if (!getStatsPassword()) {
    return NextResponse.json(
      { message: "Stats password is not configured on the server", code: "STATS_NOT_CONFIGURED" },
      { status: 503 }
    )
  }

  const session = await getSession()
  if (!session?.sub) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  let body: { password?: string }
  try {
    body = (await request.json()) as { password?: string }
  } catch {
    return NextResponse.json({ message: "Invalid body" }, { status: 400 })
  }

  const password = typeof body.password === "string" ? body.password : ""
  if (!password || !verifyStatsPassword(password)) {
    return NextResponse.json({ message: "Invalid password", code: "INVALID_PASSWORD" }, { status: 401 })
  }

  const token = await signStatsUnlockToken(session.sub)
  const res = NextResponse.json({ data: { unlocked: true } })
  res.cookies.set(STATS_UNLOCK_COOKIE, token, statsUnlockCookieOptions())
  return res
}

export async function DELETE() {
  const denied = await requireStaffApi()
  if (denied) return denied

  const res = NextResponse.json({ data: { unlocked: false } })
  res.cookies.set(STATS_UNLOCK_COOKIE, "", { ...statsUnlockCookieOptions(), maxAge: 0 })
  return res
}
