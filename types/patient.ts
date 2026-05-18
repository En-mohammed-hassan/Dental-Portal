export const BOOKING_TYPES = ["advance", "walk-in", "emergency"] as const

export const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const

export type BookingType = (typeof BOOKING_TYPES)[number]
export type BloodType = (typeof BLOOD_TYPES)[number]
export type ReservationStatus = "current" | "waiting" | "upcoming" | "completed"

export type PaymentStatusLabel = "unpaid" | "partial" | "paid"

export interface Patient {
  id: string
  patientId: string
  name: string
  phone: string
  age: number
  bloodType: BloodType
  bookingType: BookingType
  appointmentDate: string
  hasArrived: boolean
  createdAt: string
  completedAt?: string | null
  treatmentNote?: string | null
  xrayImageBase64?: string | null
  /** Stored in cents (integer) — legacy; prefer chargeCents */
  feeCents?: number | null
  chargeCents?: number | null
  paymentCents?: number | null
  balanceAfterCents?: number | null
  /** Current amount patient owes (from profile) */
  balanceDueCents?: number | null
  /** Lifetime treatment charges (ledger) */
  totalChargedCents?: number | null
  /** Lifetime payments received (ledger) */
  totalPaidCents?: number | null
  paymentStatus?: PaymentStatusLabel | null
  canalsCount?: number | null
  /** FDI permanent tooth codes, e.g. "16", "21" */
  teethTreated?: string[] | null
  procedureSummary?: string | null
}

/** Payload when completing the current treatment (admin). */
export interface FinishTreatmentInput {
  treatmentNote: string
  xrayImageBase64?: string | null
  /** Treatment charge added to balance (major units input converted to cents in UI) */
  chargeCents?: number | null
  /** Payment received this session (reduces balance) */
  paymentCents?: number | null
  /** @deprecated use chargeCents */
  feeCents?: number | null
  paymentStatus?: PaymentStatusLabel | null
  canalsCount?: number | null
  teethTreated?: string[] | null
  procedureSummary?: string | null
}

export interface NewPatientInput {
  name: string
  phone: string
  age: number
  bloodType: BloodType
  xrayImageBase64?: string | null
}

export interface NewReservationInput {
  patientId?: string
  patient?: NewPatientInput
  bookingType: BookingType
  /**
   * Walk-in / emergency: calendar date for the visit record.
   * Omitted when `slotId` is set — server uses the slot start time.
   */
  appointmentDate?: string
  /** Advance bookings from /book or admin: ties the reservation to a slot (same rules as patient booking). */
  slotId?: string
}

export interface PatientProfile {
  id: string
  name: string
  phone: string
  age: number
  bloodType: BloodType
  xrayImageBase64?: string | null
  balanceDueCents?: number
  totalChargedCents?: number
  totalPaidCents?: number
  createdAt: string
  linkedReservations?: Array<{
    id: string
    bookingType: BookingType
    status: ReservationStatus
    appointmentDate: string
    hasArrived: boolean
    createdAt: string
    completedAt?: string | null
    treatmentNote?: string | null
    xrayImageBase64?: string | null
  }>
}
