import { cookies } from "next/headers"

import { SESSION_COOKIE } from "./constants"
import { type SessionPayload, verifySessionToken } from "./jwt"

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) {
    return null
  }
  return verifySessionToken(token)
}

export async function requireStaffSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session || (session.role !== "ADMIN" && session.role !== "SECRETARY")) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requirePatientSession(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session || session.role !== "PATIENT") {
    throw new Error("Unauthorized")
  }
  return session
}
