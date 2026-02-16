import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type Patient } from "@/types/patient"
import {
  bookingTypeBadgeClass,
  bookingTypeLabels,
  formatAppointmentDate,
} from "@/utils/patient"

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
  const isEmergency = patient.bookingType === "emergency"
  const isAdvance = patient.bookingType === "advance"

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

        <div className="grid grid-cols-2 gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Age:</span> {patient.age}
          </p>
          <p>
            <span className="text-muted-foreground">Blood:</span> {patient.bloodType}
          </p>
          <p className="col-span-2">
            <span className="text-muted-foreground">Appointment:</span>{" "}
            {formatAppointmentDate(patient.appointmentDate)}
          </p>
        </div>

        {variant === "current" && (
          <Button className="w-full" disabled={actionsDisabled} onClick={onFinishTreatment}>
            Finish Treatment
          </Button>
        )}

        {variant === "history" && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">
              Completed: {patient.completedAt ? formatAppointmentDate(patient.completedAt) : "-"}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Note:</span>{" "}
              {patient.treatmentNote?.trim() || "No note"}
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
              Start Treatment
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => onCancel?.(patient.id)}
              disabled={actionsDisabled}
              title={
                isAdvance
                  ? "Cancel this waiting reservation"
                  : "Cancel this waiting reservation"
              }
            >
              Cancel
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
              Mark as Arrived
            </Button>
            <Button
              className="flex-1"
              variant="destructive"
              onClick={() => onCancel?.(patient.id)}
              disabled={actionsDisabled}
            >
              Cancel Reservation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
