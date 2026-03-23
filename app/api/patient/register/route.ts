import { UserRole, type BloodType } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { buildProfilePhoneCandidates, normalizeToE164 } from "@/lib/phone"
import { prisma } from "@/lib/server/db"
import { BLOOD_TYPES } from "@/types/patient"

export const dynamic = "force-dynamic"

const bloodToDb: Record<(typeof BLOOD_TYPES)[number], BloodType> = {
  "A+": "A_POS",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B-": "B_NEG",
  "AB+": "AB_POS",
  "AB-": "AB_NEG",
  "O+": "O_POS",
  "O-": "O_NEG",
}

const registerSchema = z.object({
  name: z.string().trim().min(3).max(80),
  phone: z.string().min(4, "Invalid phone number"),
  age: z.coerce.number().int().positive(),
  bloodType: z.enum(BLOOD_TYPES),
  xrayImageBase64: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^data:image\/[a-zA-Z+.-]+;base64,/.test(value),
      "X-ray image is invalid"
    )
    .optional()
    .or(z.literal("")),
})

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}))
    const parsed = registerSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      )
    }

    const { name, phone, age, bloodType, xrayImageBase64 } = parsed.data
    const normalizedPhone = normalizeToE164(phone, "SY")
    if (!normalizedPhone) {
      return NextResponse.json({ message: "Invalid phone number format" }, { status: 400 })
    }
    const candidates = buildProfilePhoneCandidates(phone, "SY")

    const existingProfile = await prisma.patientProfile.findFirst({ where: { phone: { in: candidates } } })
    if (existingProfile) {
      return NextResponse.json(
        { message: "This phone is already registered. Sign in with OTP instead." },
        { status: 409 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    })
    if (existingUser) {
      return NextResponse.json(
        { message: "This phone is already in use." },
        { status: 409 }
      )
    }

    await prisma.$transaction(async (tx) => {
      const profile = await tx.patientProfile.create({
        data: {
          name,
          phone: normalizedPhone,
          age,
          bloodType: bloodToDb[bloodType],
          ...(xrayImageBase64?.trim() ? { xrayImageBase64: xrayImageBase64.trim() } : {}),
        },
      })
      await tx.user.create({
        data: {
          phone: normalizedPhone,
          name,
          role: UserRole.PATIENT,
          patientProfileId: profile.id,
        },
        select: { id: true },
      })
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Registration failed"
    return NextResponse.json({ message }, { status: 500 })
  }
}
