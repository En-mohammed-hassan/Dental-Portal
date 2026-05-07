/**
 * SMS delivery providers:
 * - mock (default): free, no real SMS, logs message and returns success.
 * - twilio: paid/real SMS if TWILIO_* env vars are configured.
 */

function normalizePhone(phone: string): string {
  const trimmed = phone.trim()
  if (trimmed.startsWith("+")) {
    return trimmed
  }
  // Syrian local format: 09xxxxxxxx -> +9639xxxxxxxx
  if (/^09\d{8}$/.test(trimmed)) {
    return `+963${trimmed.slice(1)}`
  }
  // Generic fallback for other local formats that start with 0
  if (/^0\d{9,14}$/.test(trimmed)) {
    return `+${trimmed.slice(1)}`
  }
  return trimmed
}

export async function sendSms(toPhone: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const provider = (process.env.SMS_PROVIDER || "mock").trim().toLowerCase()
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER

  const to = normalizePhone(toPhone)

  if (provider === "mock") {
    console.info("[SMS mock/free provider]", { to, body })
    return { ok: true }
  }

  if (provider !== "twilio") {
    return { ok: false, error: `Unsupported SMS_PROVIDER: ${provider}` }
  }

  if (!accountSid || !authToken || !from) {
    return { ok: false, error: "Twilio provider selected but TWILIO_* variables are missing." }
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64")
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text.slice(0, 200) }
    }
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "SMS failed"
    return { ok: false, error: message }
  }
}

export function treatmentDoneMessage(patientName: string, clinicName: string): string {
  return `Hi ${patientName}, your visit at ${clinicName} is complete. Thank you for trusting us with your smile.`
}
