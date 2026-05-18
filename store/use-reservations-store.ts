"use client"

import { create } from "zustand"
import toast from "react-hot-toast"

import { i18n } from "@/lib/i18n/client"
import { translateApiMessage } from "@/lib/i18n/toast"
import { type FinishTreatmentInput, type NewReservationInput, type Patient } from "@/types/patient"
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
  finishTreatment: (payload: FinishTreatmentInput) => Promise<boolean>
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
    credentials: "include",
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
      const message =
        error instanceof Error
          ? translateApiMessage(error.message, "admin:toast.loadReservationsFailed")
          : i18n.t("admin:toast.loadReservationsFailed")
      set({
        isLoading: false,
        hasHydrated: true,
        errorMessage: message,
      })
      toast.error(message)
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
      toast.success(i18n.t("admin:toast.reservationAdded"))
    } catch (error) {
      const message =
        error instanceof Error
          ? translateApiMessage(error.message, "admin:toast.addReservationFailed")
          : i18n.t("admin:toast.addReservationFailed")
      set({ errorMessage: message })
      toast.error(message)
      throw error
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
      toast.success(i18n.t("admin:toast.markArrived"))
    } catch (error) {
      const message =
        error instanceof Error
          ? translateApiMessage(error.message, "admin:toast.markArrivedFailed")
          : i18n.t("admin:toast.markArrivedFailed")
      set({ errorMessage: message })
      toast.error(message)
      throw error
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
      toast.success(i18n.t("admin:toast.treatmentStarted"))
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? translateApiMessage(error.message, "admin:toast.startTreatmentFailed")
          : i18n.t("admin:toast.startTreatmentFailed")
      set({ errorMessage: message })
      toast.error(message)
      return false
    } finally {
      set({ isProcessing: false })
    }
  },
  finishTreatment: async (payload) => {
    set({ isProcessing: true })
    try {
      const response = await requestReservations("/api/reservations/current/finish", {
        method: "POST",
        body: JSON.stringify({
          treatmentNote: payload.treatmentNote,
          xrayImageBase64: payload.xrayImageBase64 ?? null,
          chargeCents: payload.chargeCents ?? payload.feeCents ?? null,
          paymentCents: payload.paymentCents ?? null,
          feeCents: payload.feeCents ?? payload.chargeCents ?? null,
          canalsCount: payload.canalsCount ?? null,
          teethTreated: payload.teethTreated ?? null,
          procedureSummary: payload.procedureSummary ?? null,
        }),
      })
      set({ ...response.data, errorMessage: null })
      toast.success(i18n.t("admin:toast.treatmentCompleted"))
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? translateApiMessage(error.message, "admin:toast.finishTreatmentFailed")
          : i18n.t("admin:toast.finishTreatmentFailed")
      set({ errorMessage: message })
      toast.error(message)
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
      toast.success(i18n.t("admin:toast.reservationCancelled"))
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? translateApiMessage(error.message, "admin:toast.cancelReservationFailed")
          : i18n.t("admin:toast.cancelReservationFailed")
      set({ errorMessage: message })
      toast.error(message)
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
      toast.success(i18n.t("admin:toast.reservationDeleted"))
      return true
    } catch (error) {
      const message =
        error instanceof Error
          ? translateApiMessage(error.message, "admin:toast.deleteReservationFailed")
          : i18n.t("admin:toast.deleteReservationFailed")
      set({ errorMessage: message })
      toast.error(message)
      return false
    } finally {
      set({ isProcessing: false })
    }
  },
}))
