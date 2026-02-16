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
  appointmentDate: string
}

export interface PatientProfile {
  id: string
  name: string
  phone: string
  age: number
  bloodType: BloodType
  xrayImageBase64?: string | null
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
