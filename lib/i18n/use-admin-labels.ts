"use client"

import { useTranslation } from "react-i18next"

import { type BookingType, type PaymentStatusLabel } from "@/types/patient"

export function useBookingTypeLabels() {
  const { t } = useTranslation("admin")
  return {
    advance: t("bookingTypes.advance"),
    "walk-in": t("bookingTypes.walkIn"),
    emergency: t("bookingTypes.emergency"),
  } satisfies Record<BookingType, string>
}

export function usePaymentStatusLabels() {
  const { t } = useTranslation("admin")
  return {
    unpaid: t("paymentStatus.unpaid"),
    partial: t("paymentStatus.partial"),
    paid: t("paymentStatus.paid"),
  } satisfies Record<PaymentStatusLabel, string>
}
