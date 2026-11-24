"use client"

import {
  CalendarDays,
  Clock3,
  FileText,
  IdCard,
  Loader2,
  Pencil,
  Phone,
  Save,
  Trash2,
  UserRound,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  type BookingType,
  type ReservationStatus,
  type ServiceType,
  type UpdateReservationInput,
} from "@/types/patient"
import { serviceTypeBadgeClass } from "@/utils/patient"

export type ScheduleReservation = {
  id: string
  patientId: string | null
  patientName: string
  patientPhone: string | null
  patientDocumentNumber: string | null
  bookingType: BookingType
  status: ReservationStatus
  hasArrived: boolean
  startsAt: string
  endsAt: string
  createdAt: string
  durationMinutes: number
  note?: string | null
  serviceType: ServiceType
}

type Props = {
  reservation: ScheduleReservation | null
  open: boolean
  isProcessing?: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (reservationId: string, payload: UpdateReservationInput) => Promise<boolean>
  onDelete: (reservationId: string) => Promise<boolean>
  onChanged: () => void
}

function inputParts(value: string) {
  const date = new Date(value)
  const pad = (number: number) => String(number).padStart(2, "0")
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

function statusKey(status: ReservationStatus) {
  return `linkedReservations.status${status.charAt(0).toUpperCase()}${status.slice(1)}`
}

export function ReservationDetailsDialog({
  reservation,
  open,
  isProcessing = false,
  onOpenChange,
  onUpdate,
  onDelete,
  onChanged,
}: Props) {
  const { t, i18n } = useTranslation(["admin", "common"])
  const locale = i18n.language || "en"
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [dateValue, setDateValue] = useState("")
  const [timeValue, setTimeValue] = useState("")
  const [durationValue, setDurationValue] = useState("")
  const [serviceType, setServiceType] = useState<ServiceType>("dental")
  const [note, setNote] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!reservation) return
    const parts = inputParts(reservation.startsAt)
    setDateValue(parts.date)
    setTimeValue(parts.time)
    setDurationValue(reservation.durationMinutes > 0 ? String(reservation.durationMinutes) : "")
    setServiceType(reservation.serviceType)
    setNote(reservation.note ?? "")
    setEditing(false)
    setConfirmingDelete(false)
    setFormError(null)
  }, [reservation])

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [locale]
  )
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale]
  )

  if (!reservation) return null

  const start = new Date(reservation.startsAt)
  const end = new Date(reservation.endsAt)
  const created = new Date(reservation.createdAt)
  const canModify = reservation.status !== "current"
  const bookingTypeKey = reservation.bookingType === "walk-in" ? "walkIn" : reservation.bookingType

  const handleSave = async () => {
    setFormError(null)
    if (!dateValue || !timeValue) {
      setFormError(t("scheduler.invalidManualTime"))
      return
    }

    const appointmentDate = new Date(`${dateValue}T${timeValue}:00`)
    if (Number.isNaN(appointmentDate.getTime())) {
      setFormError(t("scheduler.invalidManualTime"))
      return
    }

    let durationMinutes: number | null = null
    if (durationValue.trim()) {
      durationMinutes = Number(durationValue)
      if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) {
        setFormError(t("scheduler.invalidDuration"))
        return
      }
    }
    if (note.trim().length > 500) {
      setFormError(t("scheduler.noteTooLong"))
      return
    }

    const updated = await onUpdate(reservation.id, {
      appointmentDate: appointmentDate.toISOString(),
      durationMinutes,
      serviceType,
      note: note.trim() || null,
    })
    if (updated) {
      setEditing(false)
      onOpenChange(false)
      onChanged()
    }
  }

  const handleDelete = async () => {
    const deleted = await onDelete(reservation.id)
    if (deleted) {
      onOpenChange(false)
      onChanged()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-4 py-4 text-start sm:px-6">
          <div className="flex min-w-0 items-start gap-3 pe-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="truncate text-xl">{reservation.patientName}</DialogTitle>
              <DialogDescription className="mt-1">
                {t("reservationDetails.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          {!editing ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn("border font-medium", serviceTypeBadgeClass[reservation.serviceType])}
                >
                  {t(`scheduler.service.${reservation.serviceType}`)}
                </Badge>
                <Badge variant="secondary" className="border border-border bg-muted text-foreground">
                  {t(statusKey(reservation.status))}
                </Badge>
                <Badge variant="outline" className="border-border bg-background text-foreground">
                  {t(`bookingTypes.${bookingTypeKey}`)}
                </Badge>
              </div>

              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/25 p-3">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {t("reservationDetails.date")}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold capitalize">{dateFormatter.format(start)}</dd>
                </div>
                <div className="rounded-xl border bg-muted/25 p-3">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {t("reservationDetails.timeAndPeriod")}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {timeFormatter.format(start)}
                    {reservation.durationMinutes > 0
                      ? ` – ${timeFormatter.format(end)} (${reservation.durationMinutes} ${t("scheduler.min")})`
                      : ` · ${t("reservationDetails.noPeriod")}`}
                  </dd>
                </div>
                <div className="rounded-xl border bg-muted/25 p-3">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {t("patients.phone")}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold" dir="ltr">
                    {reservation.patientPhone || t("reservationDetails.notProvided")}
                  </dd>
                </div>
                <div className="rounded-xl border bg-muted/25 p-3">
                  <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <IdCard className="h-3.5 w-3.5" />
                    {t("patients.documentNumber")}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold">
                    {reservation.patientDocumentNumber || t("reservationDetails.notProvided")}
                  </dd>
                </div>
              </dl>

              <section className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/35 dark:text-amber-100">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4" />
                  <h3>{t("reservationDetails.noteTitle")}</h3>
                </div>
                <p className="min-h-12 whitespace-pre-wrap text-sm leading-6">
                  {reservation.note || t("reservationDetails.noNote")}
                </p>
              </section>

              <p className="text-xs text-muted-foreground">
                {t("reservationDetails.createdAt", {
                  value: `${dateFormatter.format(created)} · ${timeFormatter.format(created)}`,
                })}
                {` · ${t("reservationDetails.arrived", {
                  value: reservation.hasArrived ? t("linkedReservations.yes") : t("linkedReservations.no"),
                })}`}
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-edit-date">{t("reservationDetails.date")}</Label>
                  <Input
                    id="reservation-edit-date"
                    type="date"
                    value={dateValue}
                    onChange={(event) => setDateValue(event.target.value)}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reservation-edit-time">{t("scheduler.manualStartTime")}</Label>
                  <Input
                    id="reservation-edit-time"
                    type="time"
                    value={timeValue}
                    onChange={(event) => setTimeValue(event.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reservation-edit-duration">{t("scheduler.durationMinutes")}</Label>
                <Input
                  id="reservation-edit-duration"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1440}
                  step={1}
                  value={durationValue}
                  placeholder={t("scheduler.durationPlaceholder")}
                  onChange={(event) => setDurationValue(event.target.value)}
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("scheduler.serviceType")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["dental", "laser"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={serviceType === value ? "default" : "outline"}
                      onClick={() => setServiceType(value)}
                      disabled={isProcessing}
                    >
                      {t(`scheduler.service.${value}`)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="reservation-edit-note">{t("reservationDetails.noteTitle")}</Label>
                  <span className="text-xs tabular-nums text-muted-foreground">{note.length}/500</span>
                </div>
                <Textarea
                  id="reservation-edit-note"
                  className="min-h-28 resize-y"
                  maxLength={500}
                  value={note}
                  placeholder={t("scheduler.reservationNotePlaceholder")}
                  onChange={(event) => setNote(event.target.value)}
                  disabled={isProcessing}
                />
              </div>

              {formError && (
                <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>
          )}

          {confirmingDelete && (
            <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <p className="font-semibold text-destructive">{t("reservationDetails.deleteTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("reservationDetails.deleteDescription")}
              </p>
              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setConfirmingDelete(false)} disabled={isProcessing}>
                  {t("common:actions.cancel")}
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t("reservationDetails.confirmDelete")}
                </Button>
              </div>
            </div>
          )}

          {!canModify && (
            <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              {t("reservationDetails.currentLocked")}
            </p>
          )}
        </div>

        {!confirmingDelete && (
          <DialogFooter className="border-t px-4 py-4 sm:px-6">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={isProcessing}>
                  {t("common:actions.cancel")}
                </Button>
                <Button onClick={handleSave} disabled={isProcessing}>
                  {isProcessing ? (
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="me-2 h-4 w-4" />
                  )}
                  {t("reservationDetails.saveChanges")}
                </Button>
              </>
            ) : canModify ? (
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={isProcessing}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {t("actions.delete")}
                </Button>
                <Button onClick={() => setEditing(true)} disabled={isProcessing}>
                  <Pencil className="me-2 h-4 w-4" />
                  {t("reservationDetails.editReservation")}
                </Button>
              </div>
            ) : null}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
