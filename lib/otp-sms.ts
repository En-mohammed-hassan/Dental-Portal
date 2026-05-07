import { sendSms } from "@/lib/sms"

/**
 * Sends patient OTP through the configured SMS provider.
 * Default is free `mock` mode (no real SMS, code is surfaced by API/UI).
 */
export async function sendPatientOtpSms(phone: string, code: string): Promise<{
  ok: boolean
  skipped?: boolean
  error?: string
}> {
  const clinic =
    process.env.OTP_SMS_SENDER_NAME?.trim() || process.env.NEXT_PUBLIC_CLINIC_SHORT_NAME || "Elkood"
  const body = `${clinic}: Your verification code is ${code}. It expires in 5 minutes.`
  return sendSms(phone, body)
}
