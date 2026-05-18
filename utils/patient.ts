import { formatDate } from "@/lib/format"
import { type Locale } from "@/lib/locale"
import { type BookingType, type Patient } from "@/types/patient"

export const bookingTypeLabels: Record<BookingType, string> = {
  advance: "Advance",
  "walk-in": "Walk-in",
  emergency: "Emergency",
}

export const bookingTypeBadgeClass: Record<BookingType, string> = {
  advance: "bg-blue-600 text-white border-transparent",
  "walk-in": "bg-slate-500 text-white border-transparent",
  emergency: "bg-red-600 text-white border-transparent",
}

export function formatAppointmentDate(date: string, locale: Locale = "en"): string {
  return formatDate(date, locale)
}

export function sortByAppointmentDate(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    return (
      new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
    )
  })
}

export function createPatientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}
