import { type Patient } from "@/types/patient"

export interface ReservationsData {
  currentPatient: Patient | null
  waitingPatients: Patient[]
  upcomingPatients: Patient[]
  treatmentHistory: Patient[]
}

export interface ReservationsApiResponse {
  data: ReservationsData
  message?: string
}
