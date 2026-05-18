import { timingSafeEqual } from "node:crypto"

import { SignJWT, jwtVerify } from "jose"

import { STATS_JWT_ISSUER, STATS_UNLOCK_MAX_AGE_SEC } from "./stats-constants"

export const STATS_UNLOCK_COOKIE = "elkood_stats_unlock"

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)")
  }
  return new TextEncoder().encode(secret)
}

export function getStatsPassword(): string | null {
  const value = process.env.ADMIN_STATS_PASSWORD?.trim()
  return value && value.length > 0 ? value : null
}

export function verifyStatsPassword(candidate: string): boolean {
  const expected = getStatsPassword()
  if (!expected) return false

  const a = Buffer.from(candidate, "utf8")
  const b = Buffer.from(expected, "utf8")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function signStatsUnlockToken(staffSub: string): Promise<string> {
  return new SignJWT({ scope: "stats" })
    .setSubject(staffSub)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(STATS_JWT_ISSUER)
    .setExpirationTime(`${STATS_UNLOCK_MAX_AGE_SEC}s`)
    .sign(getSecret())
}

export async function verifyStatsUnlockToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: STATS_JWT_ISSUER,
      algorithms: ["HS256"],
    })
    return payload.scope === "stats" && typeof payload.sub === "string"
  } catch {
    return false
  }
}

export function statsUnlockCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: STATS_UNLOCK_MAX_AGE_SEC,
  }
}
