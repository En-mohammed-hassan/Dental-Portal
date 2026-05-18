"use client"

import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBookingTypeLabels } from "@/lib/i18n/use-admin-labels"
import { PatientBillingPanel } from "@/components/billing/patient-billing-summary"
import { parseLocale } from "@/lib/locale"
import { cn } from "@/lib/utils"
import { type Patient } from "@/types/patient"
import { bookingTypeBadgeClass, formatAppointmentDate } from "@/utils/patient"

type CardVariant = "current" | "waiting" | "upcoming"
type ExtendedCardVariant = CardVariant | "history"

interface PatientCardProps {
  patient: Patient
  variant: ExtendedCardVariant
  onStartTreatment?: (patientId: string) => void
  onFinishTreatment?: () => void
  onMarkAsArrived?: (patientId: string) => void
  onCancel?: (patientId: string) => void
  actionsDisabled?: boolean
}

export function PatientCard({
  patient,
  variant,
  onStartTreatment,
  onFinishTreatment,
  onMarkAsArrived,
  onCancel,
  actionsDisabled = false,
}: PatientCardProps) {
  const { t, i18n } = useTranslation("admin")
  const locale = parseLocale(i18n.language)
  const bookingTypeLabels = useBookingTypeLabels()
  const balanceDue = patient.balanceDueCents ?? 0
  const totalCharged = patient.totalChargedCents ?? 0
  const totalPaid = patient.totalPaidCents ?? 0
  const isEmergency = patient.bookingType === "emergency"
  const showBilling = variant === "current" || totalCharged > 0 || totalPaid > 0 || balanceDue > 0

  return (
    <Card
      className={cn(
        "gap-3 border py-4",
        isEmergency && "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
      )}
    >
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold">{patient.name}</h3>
            <p className="text-muted-foreground text-sm">{patient.phone}</p>
          </div>
          <Badge className={bookingTypeBadgeClass[patient.bookingType]}>
            {bookingTypeLabels[patient.bookingType]}
          </Badge>
        </div>

        {showBilling ? (
          <PatientBillingPanel
            totalChargedCents={totalCharged}
            totalPaidCents={totalPaid}
            balanceDueCents={balanceDue}
            locale={locale}
            className="text-start"
          />
        ) : null}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">{t("reservations.age")}:</span> {patient.age}
          </p>
          <p>
            <span className="text-muted-foreground">{t("reservations.blood")}:</span>{" "}
            {patient.bloodType}
          </p>
          <p className="col-span-2">
            <span className="text-muted-foreground">{t("reservations.appointment")}:</span>{" "}
            {formatAppointmentDate(patient.appointmentDate)}
          </p>
        </div>

        {variant === "current" && (
          <Button className="w-full" disabled={actionsDisabled} onClick={onFinishTreatment}>
            {t("reservations.finishTreatment")}
          </Button>
        )}

        {variant === "history" && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              {t("reservations.completed")}:{" "}
              {patient.completedAt ? formatAppointmentDate(patient.completedAt) : "-"}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">{t("reservations.note")}:</span>{" "}
              {patient.treatmentNote?.trim() || t("reservations.noNote")}
            </p>
          </div>
        )}

        {variant === "waiting" && (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={actionsDisabled}
              onClick={() => onStartTreatment?.(patient.id)}
            >
              {t("reservations.startTreatment")}
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => onCancel?.(patient.id)}
              disabled={actionsDisabled}
            >
              {t("reservations.cancel")}
            </Button>
          </div>
        )}

        {variant === "upcoming" && (
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={actionsDisabled}
              onClick={() => onMarkAsArrived?.(patient.id)}
            >
              {t("reservations.markArrived")}
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => onCancel?.(patient.id)}
              disabled={actionsDisabled}
            >
              {t("reservations.cancelReservation")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
