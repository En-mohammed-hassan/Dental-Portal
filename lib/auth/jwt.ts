import { SignJWT, jwtVerify, type JWTPayload } from "jose"

import { JWT_ISSUER, SESSION_MAX_AGE_SEC } from "./constants"

export type SessionPayload = JWTPayload & {
  sub: string
  role: "ADMIN" | "SECRETARY" | "PATIENT"
  phone: string
  /** Set for PATIENT sessions — links to PatientProfile */
  patientProfileId?: string
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 characters)")
  }
  return new TextEncoder().encode(secret)
}

export async function signSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp" | keyof JWTPayload> & {
    sub: string
    role: SessionPayload["role"]
    phone: string
    patientProfileId?: string
  }
): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(`${SESSION_MAX_AGE_SEC}s`)
    .sign(getSecret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: JWT_ISSUER,
      algorithms: ["HS256"],
    })
    const sub = payload.sub
    const role = payload.role
    const phone = payload.phone
    if (typeof sub !== "string" || typeof phone !== "string") {
      return null
    }
    if (role !== "ADMIN" && role !== "SECRETARY" && role !== "PATIENT") {
      return null
    }
    const patientProfileId =
      typeof payload.patientProfileId === "string" ? payload.patientProfileId : undefined
    return { ...payload, sub, role, phone, patientProfileId }
  } catch {
    return null
  }
}
