import { NextResponse } from "next/server"
import { z } from "zod"
import { type CountryCode } from "libphonenumber-js"

import { sendPatientOtpSms } from "@/lib/otp-sms"
import { buildProfilePhoneCandidates, fixedOtpFromPhone, normalizeToE164 } from "@/lib/phone"
import { ensureSeededAdminPhones, findAdminPhoneByCandidates } from "@/lib/server/admin-phones"
import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  phone: z.string().min(4, "Enter a valid phone number"),
  country: z.string().length(2).optional(),
})

const OTP_TTL_MS = 5 * 60 * 1000

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid phone" },
        { status: 400 }
      )
    }

    const country = (parsed.data.country?.toUpperCase() || "SY") as CountryCode
    const normalizedPhone = normalizeToE164(parsed.data.phone, country)
    if (!normalizedPhone) {
      return NextResponse.json({ message: "Invalid phone number format." }, { status: 400 })
    }

    const candidates = buildProfilePhoneCandidates(parsed.data.phone, country)

    await ensureSeededAdminPhones()

    const [adminPhone, profile] = await Promise.all([
      findAdminPhoneByCandidates(candidates),
      prisma.patientProfile.findFirst({
        where: { phone: { in: candidates } },
      }),
    ])

    if (!adminPhone && !profile) {
      return NextResponse.json(
        { message: "This number is not registered. Please contact admin." },
        { status: 404 }
      )
    }

    const phoneKey = adminPhone?.phone ?? profile!.phone

    const code = fixedOtpFromPhone(parsed.data.phone, country)
    if (!code) {
      return NextResponse.json({ message: "Could not generate OTP for this number." }, { status: 400 })
    }
    const expiresAt = new Date(Date.now() + OTP_TTL_MS)

    await prisma.otpCode.deleteMany({ where: { phone: phoneKey } })
    await prisma.otpCode.create({
      data: { phone: phoneKey, code, expiresAt },
    })

    const sms = await sendPatientOtpSms(normalizedPhone, code)
    const forceMockOnRegionError =
      !sms.ok && /"code"\s*:\s*21408|not been enabled for the region|not available/i.test(sms.error ?? "")

    if (forceMockOnRegionError) {
      const provider = (process.env.SMS_PROVIDER || "mock").trim().toLowerCase()
      console.info("[OTP Twilio fallback -> mock]", {
        to: normalizedPhone,
        reason: sms.error,
        provider,
      })
      return NextResponse.json({
        ok: true,
        delivery: "in_app",
        phoneKey,
        fallbackReason: "country_not_eligible",
      })
    }

    if (!sms.ok) {
      await prisma.otpCode.deleteMany({ where: { phone: phoneKey } })
      return NextResponse.json(
        { message: sms.error ?? "Could not deliver verification code." },
        { status: 502 }
      )
    }

    const provider = (process.env.SMS_PROVIDER || "mock").trim().toLowerCase()

    return NextResponse.json({
      ok: true,
      delivery: provider === "mock" ? "in_app" : "sms",
      phoneKey,
      loginType: adminPhone ? "admin" : "patient",
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send code"
    return NextResponse.json({ message }, { status: 500 })
  }
}
