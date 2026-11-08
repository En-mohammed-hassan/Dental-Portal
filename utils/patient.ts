import { formatDate } from "@/lib/format"
import { type Locale } from "@/lib/locale"
import {
  type BookingType,
  type Patient,
  type ReservationStatus,
  type ServiceType,
} from "@/types/patient"

export const bookingTypeLabels: Record<BookingType, string> = {
  advance: "Advance",
  "walk-in": "Walk-in",
  emergency: "Emergency",
}

export const bookingTypeBadgeClass: Record<BookingType, string> = {
  advance:
    "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-200",
  "walk-in":
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  emergency:
    "border-red-200 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-950/70 dark:text-red-200",
}

export const serviceTypeBadgeClass: Record<ServiceType, string> = {
  dental:
    "border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/70 dark:text-teal-200",
  laser:
    "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200",
}

export const reservationStatusBadgeClass: Record<ReservationStatus, string> = {
  current:
    "border-green-200 bg-green-100 text-green-900 dark:border-green-800 dark:bg-green-950/70 dark:text-green-100",
  waiting:
    "border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-100",
  upcoming:
    "border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-100",
  completed:
    "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
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
