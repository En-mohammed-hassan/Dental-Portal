import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth/session"

export async function requireStaffApi(): Promise<NextResponse | null> {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SECRETARY")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  return null
}
