"use client"

import { create } from "zustand"

import { type NewReservationInput, type Patient } from "@/types/patient"
import { type ReservationsApiResponse } from "@/types/reservations"

interface ReservationsState {
  currentPatient: Patient | null
  waitingPatients: Patient[]
  upcomingPatients: Patient[]
  treatmentHistory: Patient[]
  isLoading: boolean
  isProcessing: boolean
  hasHydrated: boolean
  errorMessage: string | null
  hydrate: () => Promise<void>
  addReservation: (payload: NewReservationInput) => Promise<void>
  markAsArrived: (patientId: string) => Promise<void>
  startTreatment: (patientId: string, replaceCurrent: boolean) => Promise<boolean>
  finishTreatment: (treatmentNote: string, xrayImageBase64?: string | null) => Promise<boolean>
  cancelReservation: (patientId: string) => Promise<boolean>
  deleteReservationFromHistory: (reservationId: string) => Promise<boolean>
}

const initialState = {
  currentPatient: null,
  waitingPatients: [],
  upcomingPatients: [],
  treatmentHistory: [],
  isLoading: false,
  isProcessing: false,
  hasHydrated: false,
  errorMessage: null,
}

async function requestReservations(
  endpoint: string,
  init?: RequestInit
): Promise<ReservationsApiResponse> {
  const response = await fetch(endpoint, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const data = (await response.json().catch(() => ({}))) as ReservationsApiResponse & {
    message?: string
  }

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed")
  }

  return data
}

export const useReservationsStore = create<ReservationsState>()((set) => ({
  ...initialState,
  hydrate: async () => {
    if (useReservationsStore.getState().hasHydrated) return
    set({ isLoading: true, errorMessage: null })
    try {
      const response = await requestReservations("/api/reservations")
      set({
        ...response.data,
        isLoading: false,
        hasHydrated: true,
        errorMessage: null,
      })
    } catch (error) {
      set({
        isLoading: false,
        hasHydrated: true,
        errorMessage: error instanceof Error ? error.message : "Failed to load reservations",
      })
    }
  },
  addReservation: async (payload) => {
    set({ isProcessing: true })
    try {
      const response = await requestReservations("/api/reservations", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      set({ ...response.data, errorMessage: null })
    } finally {
      set({ isProcessing: false })
    }
  },
  markAsArrived: async (patientId) => {
    set({ isProcessing: true })
    try {
      const response = await requestReservations(`/api/reservations/${patientId}/arrive`, {
        method: "POST",
      })
      set({ ...response.data, errorMessage: null })
    } finally {
      set({ isProcessing: false })
    }
  },
  startTreatment: async (patientId, replaceCurrent) => {
    set({ isProcessing: true })
    try {
      const response = await requestReservations(`/api/reservations/${patientId}/start`, {
        method: "POST",
        body: JSON.stringify({ replaceCurrent }),
      })
      set({ ...response.data, errorMessage: null })
      return true
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Failed to start treatment",
      })
      return false
    } finally {
      set({ isProcessing: false })
    }
  },
  finishTreatment: async (treatmentNote, xrayImageBase64) => {
    set({ isProcessing: true })
    try {
      const response = await requestReservations("/api/reservations/current/finish", {
        method: "POST",
        body: JSON.stringify({ treatmentNote, xrayImageBase64: xrayImageBase64 ?? null }),
      })
      set({ ...response.data, errorMessage: null })
      return true
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Failed to finish treatment",
      })
      return false
    } finally {
      set({ isProcessing: false })
    }
  },
  cancelReservation: async (patientId) => {
    set({ isProcessing: true })
    try {
      const response = await requestReservations(`/api/reservations/${patientId}`, {
        method: "DELETE",
      })
      set({ ...response.data, errorMessage: null })
      return true
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Failed to cancel reservation",
      })
      return false
    } finally {
      set({ isProcessing: false })
    }
  },
  deleteReservationFromHistory: async (reservationId) => {
    set({ isProcessing: true })
    try {
      const response = await requestReservations(
        `/api/reservations/${reservationId}?fromHistory=true`,
        {
          method: "DELETE",
        }
      )
      set({ ...response.data, errorMessage: null })
      return true
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Failed to delete reservation",
      })
      return false
    } finally {
      set({ isProcessing: false })
    }
  },
}))
