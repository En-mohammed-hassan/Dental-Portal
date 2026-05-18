import { i18n } from "@/lib/i18n/client"

/** Translate known API English messages; otherwise return the message or a fallback key. */
export function translateApiMessage(message: string | undefined, fallbackKey: string): string {
  if (!message?.trim()) {
    return i18n.t(fallbackKey)
  }

  const map: Record<string, string> = {
    "Request failed": "common:errors.requestFailed",
    "Failed to load reservations": "admin:toast.loadReservationsFailed",
    "Failed to add reservation": "admin:toast.addReservationFailed",
    "Failed to mark patient as arrived": "admin:toast.markArrivedFailed",
    "Failed to start treatment": "admin:toast.startTreatmentFailed",
    "Failed to finish treatment": "admin:toast.finishTreatmentFailed",
    "Failed to cancel reservation": "admin:toast.cancelReservationFailed",
    "Failed to delete reservation": "admin:toast.deleteReservationFailed",
    "Could not send OTP": "auth:otpSendFailed",
    "Invalid code": "auth:invalidCode",
    Failed: "common:errors.generic",
  }

  const key = map[message.trim()]
  if (key) {
    return i18n.t(key)
  }

  return message
}
