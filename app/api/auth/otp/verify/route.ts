import { UserRole } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { sessionCookieOptions } from "@/lib/auth/cookie-options"
import { SESSION_COOKIE } from "@/lib/auth/constants"
import { signSessionToken } from "@/lib/auth/jwt"
import { buildProfilePhoneCandidates } from "@/lib/phone"
import { ensureSeededAdminPhones, findAdminPhoneExact } from "@/lib/server/admin-phones"
import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  phone: z.string().min(4),
  code: z.string().length(6),
})

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid code or phone" }, { status: 400 })
    }

    const { phone, code } = parsed.data
    const candidates = buildProfilePhoneCandidates(phone as string, "SY")
    if (candidates.length === 0) {
      return NextResponse.json({ message: "Invalid phone format" }, { status: 400 })
    }

    await ensureSeededAdminPhones()

    const otp = await prisma.otpCode.findFirst({
      where: { phone: { in: candidates }, code },
      orderBy: { createdAt: "desc" },
    })

    if (!otp || otp.expiresAt < new Date()) {
      return NextResponse.json({ message: "Invalid or expired code" }, { status: 401 })
    }

    const phoneKey = otp.phone
    await prisma.otpCode.deleteMany({ where: { phone: phoneKey } })

    const [adminPhone, profile] = await Promise.all([
      findAdminPhoneExact(phoneKey),
      prisma.patientProfile.findUnique({ where: { phone: phoneKey } }),
    ])

    if (!adminPhone && !profile) {
      return NextResponse.json({ message: "Account not found for this number" }, { status: 404 })
    }

    let user = await prisma.user.findUnique({
      where: { phone: phoneKey },
      select: {
        id: true,
        phone: true,
        name: true,
        role: true,
        patientProfileId: true,
      },
    })
    let role: "ADMIN" | "PATIENT" = adminPhone ? "ADMIN" : "PATIENT"

    if (adminPhone) {
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone: phoneKey,
            name: adminPhone.label ?? "Clinic Admin",
            role: UserRole.ADMIN,
          },
          select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            patientProfileId: true,
          },
        })
      } else if (user.role !== UserRole.ADMIN) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.ADMIN, patientProfileId: null },
          select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            patientProfileId: true,
          },
        })
      }
    } else {
      if (!profile) {
        return NextResponse.json({ message: "Patient profile not found" }, { status: 404 })
      }
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone: phoneKey,
            name: profile.name,
            role: UserRole.PATIENT,
            patientProfileId: profile.id,
          },
          select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            patientProfileId: true,
          },
        })
      } else if (user.role !== UserRole.PATIENT || user.patientProfileId !== profile.id) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.PATIENT, patientProfileId: profile.id, name: profile.name },
          select: {
            id: true,
            phone: true,
            name: true,
            role: true,
            patientProfileId: true,
          },
        })
      }
    }

    const token = await signSessionToken(
      role === "PATIENT"
        ? {
            sub: user.id,
            role: "PATIENT",
            phone: user.phone,
            patientProfileId: user.patientProfileId ?? undefined,
          }
        : {
            sub: user.id,
            role: "ADMIN",
            phone: user.phone,
          }
    )

    const res = NextResponse.json({
      ok: true,
      user: {
        role: role,
        phone: user.phone,
        patientProfileId: user.patientProfileId ?? null,
        kind: role === "ADMIN" ? ("admin" as const) : ("patient" as const),
      },
    })
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
    return res
  } catch (e) {
    const message = e instanceof Error ? e.message : "Verification failed"
    return NextResponse.json({ message }, { status: 500 })
  }
}
