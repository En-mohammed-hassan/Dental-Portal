"use client"

import {
  addDays,
  addMinutes,
  addMonths,
  format,
  getDay,
  startOfMonth,
  subMonths,
} from "date-fns"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { type CountryCode } from "libphonenumber-js"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import { PhoneCountryField } from "@/components/ui/phone-country-field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBookingTypeLabels } from "@/lib/i18n/use-admin-labels"
import { buildE164FromCountryAndLocal, isValidForCountry } from "@/lib/phone"
import {
  CLINIC_CLOSE_MINUTES,
  CLINIC_OPEN_MINUTES,
} from "@/lib/scheduling/clinic-hours"
import { cn } from "@/lib/utils"
import {
  ALLOWED_RESERVATION_DURATIONS,
  BLOOD_TYPES,
  type BloodType,
  type BookingType,
  type NewReservationInput,
  type PatientProfile,
  type ReservationDuration,
  type ServiceType,
} from "@/types/patient"
import { serviceTypeBadgeClass } from "@/utils/patient"

type DayAppointment = {
  id: string
  patientId: string
  patientName: string
  patientPhone: string | null
  bookingType: BookingType
  status: string
  startsAt: string
  endsAt: string
  durationMinutes: number
  serviceType: ServiceType
}

type MonthCount = { date: string; reservationCount: number }

type Props = {
  onSubmitReservation: (payload: NewReservationInput) => Promise<void> | void
  onCancelReservation?: (reservationId: string) => Promise<boolean>
  isProcessing?: boolean
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function apiRange(date: Date, days: number) {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const to = addDays(from, days)
  return { from: from.toISOString(), to: to.toISOString() }
}

function timeLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function ReservationSchedulerDialog({
  onSubmitReservation,
  onCancelReservation,
  isProcessing = false,
}: Props) {
  const { t, i18n } = useTranslation(["admin", "common"])
  const bookingTypeLabels = useBookingTypeLabels()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"schedule" | "patient">("schedule")
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [monthLoading, setMonthLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [appointments, setAppointments] = useState<DayAppointment[]>([])
  const [dayLoading, setDayLoading] = useState(false)
  const [reservationToCancel, setReservationToCancel] = useState<DayAppointment | null>(null)
  const [periodEditorOpen, setPeriodEditorOpen] = useState(false)
  const [duration, setDuration] = useState<ReservationDuration>(30)
  const [manualTime, setManualTime] = useState("")
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [name, setName] = useState("")
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("SY")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [age, setAge] = useState("")
  const [bloodType, setBloodType] = useState<BloodType | "none">("none")
  const [xrayImageBase64, setXrayImageBase64] = useState<string | null>(null)
  const [serviceType, setServiceType] = useState<ServiceType>("dental")
  const [bookingType, setBookingType] = useState<BookingType>("advance")
  const [reminderId, setReminderId] = useState<string | undefined>()
  const [inlineError, setInlineError] = useState<string | null>(null)

  const reset = () => {
    setStep("schedule")
    setSelectedDay(null)
    setAppointments([])
    setReservationToCancel(null)
    setPeriodEditorOpen(false)
    setDuration(30)
    setManualTime("")
    setPatientMode("existing")
    setSelectedPatientId("")
    setPatientSearch("")
    setName("")
    setPhoneCountry("SY")
    setPhoneLocal("")
    setAge("")
    setBloodType("none")
    setXrayImageBase64(null)
    setServiceType("dental")
    setBookingType("advance")
    setReminderId(undefined)
    setInlineError(null)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("newReservation") === "1") {
      setSelectedPatientId(params.get("patientId") ?? "")
      setReminderId(params.get("reminderId") ?? undefined)
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const from = startOfMonth(month)
    const to = startOfMonth(addMonths(month, 1))
    setMonthLoading(true)
    void fetch(
      `/api/admin/schedule/month?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
      { credentials: "include", cache: "no-store" }
    )
      .then(async (response) => {
        const payload = (await response.json()) as { days?: MonthCount[]; message?: string }
        if (!response.ok) throw new Error(payload.message ?? t("scheduler.loadMonthFailed"))
        setMonthCounts(
          Object.fromEntries((payload.days ?? []).map((day) => [day.date, day.reservationCount]))
        )
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : t("scheduler.loadMonthFailed"))
        setMonthCounts({})
      })
      .finally(() => setMonthLoading(false))
  }, [month, open, t])

  useEffect(() => {
    if (!open) return
    setPatientsLoading(true)
    void fetch("/api/patients", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { data?: PatientProfile[]; message?: string }
        if (!response.ok) throw new Error(payload.message ?? t("patients.loadFailed"))
        setPatients(payload.data ?? [])
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : t("patients.loadFailed"))
        setPatients([])
      })
      .finally(() => setPatientsLoading(false))
  }, [open, t])

  const loadDay = async (day: Date) => {
    setSelectedDay(day)
    setManualTime("")
    setPeriodEditorOpen(false)
    setDayLoading(true)
    const range = apiRange(day, 1)
    try {
      const response = await fetch(
        `/api/admin/schedule/day?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
        { credentials: "include", cache: "no-store" }
      )
      const payload = (await response.json()) as {
        reservations?: DayAppointment[]
        message?: string
      }
      if (!response.ok) throw new Error(payload.message ?? t("scheduler.loadDayFailed"))
      setAppointments(payload.reservations ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("scheduler.loadDayFailed"))
      setAppointments([])
    } finally {
      setDayLoading(false)
    }
  }

  const calendarDays = useMemo(() => {
    const first = startOfMonth(month)
    const next = startOfMonth(addMonths(month, 1))
    const days: Date[] = []
    for (let day = first; day < next; day = addDays(day, 1)) days.push(day)
    return { days, leading: getDay(first) }
  }, [month])

  const latestStartMinutes = CLINIC_CLOSE_MINUTES - duration
  const latestStartValue = `${String(Math.floor(latestStartMinutes / 60)).padStart(2, "0")}:${String(latestStartMinutes % 60).padStart(2, "0")}`

  const manualPeriod = useMemo(() => {
    if (!selectedDay || !manualTime) {
      return { start: null as Date | null, end: null as Date | null, error: null as string | null }
    }

    const match = /^(\d{2}):(\d{2})$/.exec(manualTime)
    if (!match) {
      return { start: null, end: null, error: t("scheduler.invalidManualTime") }
    }

    const hour = Number(match[1])
    const minute = Number(match[2])
    const minutes = hour * 60 + minute
    const start = new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate(),
      hour,
      minute,
      0,
      0
    )
    const end = addMinutes(start, duration)

    if (minute % 15 !== 0) {
      return { start: null, end: null, error: t("scheduler.quarterHourRequired") }
    }
    if (minutes < CLINIC_OPEN_MINUTES || minutes + duration > CLINIC_CLOSE_MINUTES) {
      return { start: null, end: null, error: t("scheduler.clinicHoursRequired") }
    }
    if (!sameLocalDay(start, end)) {
      return { start: null, end: null, error: t("scheduler.clinicHoursRequired") }
    }
    if (start.getTime() < Date.now()) {
      return { start: null, end: null, error: t("scheduler.futureTimeRequired") }
    }

    return { start, end, error: null }
  }, [duration, manualTime, selectedDay, t])

  const selectedStart = manualPeriod.start
  const selectedEnd = manualPeriod.end

  const filteredPatients = useMemo(() => {
    const search = patientSearch.trim().toLowerCase()
    if (!search) return patients
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(search) ||
        (patient.phone?.toLowerCase().includes(search) ?? false)
    )
  }, [patientSearch, patients])

  const cancelSelectedReservation = async () => {
    if (!reservationToCancel || !onCancelReservation) return
    const canceled = await onCancelReservation(reservationToCancel.id)
    if (!canceled) return

    setAppointments((current) =>
      current.filter((appointment) => appointment.id !== reservationToCancel.id)
    )
    if (selectedDay) {
      const key = dateKey(selectedDay)
      setMonthCounts((current) => ({
        ...current,
        [key]: Math.max(0, (current[key] ?? 0) - 1),
      }))
    }
    setReservationToCancel(null)
  }

  const submit = async () => {
    setInlineError(null)
    if (!selectedStart) {
      setInlineError(t("scheduler.selectTimeFirst"))
      return
    }
    let patient: NewReservationInput["patient"]
    if (patientMode === "existing") {
      if (!selectedPatientId) {
        setInlineError(t("reservationForm.selectPatientFirst"))
        return
      }
    } else {
      if (name.trim().length < 3) {
        setInlineError(t("scheduler.nameRequired"))
        return
      }
      if (phoneLocal.trim() && !isValidForCountry(phoneCountry, phoneLocal)) {
        setInlineError(t("patients.phoneInvalid"))
        return
      }
      const ageValue = age.trim() ? Number(age) : null
      if (ageValue != null && (!Number.isInteger(ageValue) || ageValue <= 0)) {
        setInlineError(t("scheduler.ageInvalid"))
        return
      }
      patient = {
        name: name.trim(),
        phone: phoneLocal.trim()
          ? buildE164FromCountryAndLocal(phoneCountry, phoneLocal)
          : null,
        age: ageValue,
        bloodType: bloodType === "none" ? null : bloodType,
        ...(xrayImageBase64 ? { xrayImageBase64 } : {}),
      }
    }

    try {
      await onSubmitReservation({
        ...(patientMode === "existing" ? { patientId: selectedPatientId } : { patient }),
        bookingType,
        serviceType,
        appointmentDate: selectedStart.toISOString(),
        durationMinutes: duration,
        reminderId,
      })
      setOpen(false)
      reset()
      if (window.location.search.includes("newReservation=1")) {
        window.history.replaceState({}, "", window.location.pathname)
      }
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : t("reservationForm.saveFailed"))
    }
  }

  const todayKey = dateKey(new Date())
  const locale = i18n.language || "en"

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          reset()
          if (window.location.search.includes("newReservation=1")) {
            window.history.replaceState({}, "", window.location.pathname)
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={isProcessing}>
          <Plus className="me-2 h-4 w-4" />
          {t("reservationForm.addReservation")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[min(760px,calc(100dvh-2rem))] max-h-[94dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pe-12 sm:px-6">
          <DialogTitle>{t("scheduler.title")}</DialogTitle>
          <DialogDescription>
            {step === "schedule" ? t("scheduler.scheduleDescription") : t("scheduler.patientDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {step === "schedule" ? (
          <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="space-y-3 rounded-2xl border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setMonth((value) => subMonths(value, 1))}
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <div className="text-center">
                  <p className="font-semibold">
                    {new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month)}
                  </p>
                  {monthLoading && <Loader2 className="mx-auto mt-1 h-3.5 w-3.5 animate-spin" />}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setMonth((value) => addMonths(value, 1))}
                >
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground sm:gap-2 sm:text-xs">
                {Array.from({ length: 7 }, (_, index) => (
                  <span key={index}>
                    {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
                      new Date(2023, 0, 1 + index)
                    )}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: calendarDays.leading }, (_, index) => (
                  <span key={`blank-${index}`} />
                ))}
                {calendarDays.days.map((day) => {
                  const key = dateKey(day)
                  const selected = selectedDay ? key === dateKey(selectedDay) : false
                  const count = monthCounts[key] ?? 0
                  const isToday = key === todayKey
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => void loadDay(day)}
                      aria-label={`${format(day, "PPP")}: ${count} ${t("scheduler.reservations")}`}
                      className={cn(
                        "flex h-14 flex-col justify-between rounded-lg border p-1.5 text-start transition sm:h-16 sm:p-2",
                        selected
                          ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/15 dark:border-violet-400 dark:bg-violet-950/35"
                          : "border-border bg-background hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-700 dark:hover:bg-violet-950/20",
                        isToday && !selected && "border-blue-400 dark:border-blue-500"
                      )}
                    >
                      <span className="flex w-full items-center justify-between gap-1">
                        <span className={cn("text-sm font-semibold sm:text-base", isToday && "text-blue-600 dark:text-blue-300")}>
                          {format(day, "d")}
                        </span>
                        {isToday && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-blue-500/15"
                            title={t("reservations.today")}
                          />
                        )}
                      </span>
                      <span className="flex w-full justify-end">
                        <span
                          className={cn(
                            "inline-flex min-w-5 items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                            count > 0
                              ? "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200"
                              : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          )}
                        >
                          {count}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                {t("scheduler.chooseDayHint")}
              </p>
            </section>

            <section className="space-y-4 rounded-2xl border bg-card p-3 sm:p-4">
              {!selectedDay ? (
                <div className="flex min-h-72 flex-col items-center justify-center text-center text-muted-foreground">
                  <CalendarDays className="mb-3 h-10 w-10" />
                  <p className="font-medium">{t("scheduler.chooseDay")}</p>
                  <p className="mt-1 text-sm">{t("scheduler.chooseDayHint")}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {new Intl.DateTimeFormat(locale, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        }).format(selectedDay)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {appointments.length} {t("scheduler.reservations")}
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setPeriodEditorOpen(true)
                        setManualTime("")
                      }}
                      disabled={dayLoading}
                    >
                      <Plus className="me-2 h-4 w-4" />
                      {t("scheduler.newPeriod")}
                    </Button>
                  </div>

                  <div className="max-h-40 space-y-2 overflow-y-auto pe-1">
                    {dayLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
                    ) : appointments.length === 0 ? (
                      <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                        {t("scheduler.noReservations")}
                      </p>
                    ) : (
                      appointments.map((appointment) => (
                        <div key={appointment.id} className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-2.5 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold tabular-nums">
                              {timeLabel(new Date(appointment.startsAt), locale)} – {timeLabel(new Date(appointment.endsAt), locale)}
                            </p>
                            <p className="text-sm">{appointment.patientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.durationMinutes} {t("scheduler.minutes")}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-end sm:gap-1">
                            <Badge
                              variant="outline"
                              className={serviceTypeBadgeClass[appointment.serviceType]}
                            >
                              {t(`scheduler.service.${appointment.serviceType}`)}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{appointment.status}</span>
                            {onCancelReservation &&
                              appointment.status !== "current" &&
                              appointment.status !== "completed" && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-red-700 hover:bg-red-50 hover:text-red-800 dark:text-red-300 dark:hover:bg-red-950/50 dark:hover:text-red-200"
                                  disabled={isProcessing}
                                  onClick={() => setReservationToCancel(appointment)}
                                >
                                  <Trash2 className="me-1 h-3.5 w-3.5" />
                                  {t("scheduler.cancelReservation")}
                                </Button>
                              )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {periodEditorOpen && (
                    <div className="space-y-3 border-t pt-4">
                      <div>
                        <Label>{t("scheduler.duration")}</Label>
                        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                          {ALLOWED_RESERVATION_DURATIONS.map((value) => (
                            <Button
                              key={value}
                              type="button"
                              size="sm"
                              variant={duration === value ? "default" : "outline"}
                              onClick={() => setDuration(value)}
                              className="px-2"
                            >
                              {value} {t("scheduler.min")}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="scheduler-manual-time">
                          {t("scheduler.manualStartTime")}
                        </Label>
                        <div className="relative mt-2">
                          <Clock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="scheduler-manual-time"
                            type="time"
                            min="10:00"
                            max={latestStartValue}
                            step={15 * 60}
                            value={manualTime}
                            onChange={(event) => setManualTime(event.target.value)}
                            className="h-12 ps-10 text-base font-semibold tabular-nums"
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {t("scheduler.manualTimeHint", { latest: latestStartValue })}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("scheduler.overlapsAllowed")}
                        </p>
                        {manualPeriod.error && (
                          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                            {manualPeriod.error}
                          </p>
                        )}
                      </div>

                      {selectedStart && selectedEnd && (
                        <div className="flex items-center justify-between rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-950 dark:bg-teal-950/40 dark:text-teal-100">
                          <span>{t("scheduler.selectedPeriod")}</span>
                          <strong className="tabular-nums">
                            {timeLabel(selectedStart, locale)} – {timeLabel(selectedEnd, locale)}
                          </strong>
                        </div>
                      )}

                      <Button className="w-full" disabled={!selectedStart} onClick={() => setStep("patient")}>
                        {t("scheduler.continuePatient")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
          ) : (
          <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
            <aside className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Clock className="h-4 w-4" /> {t("scheduler.selectedPeriod")}
              </div>
              <p className="text-sm">
                {selectedDay && new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(selectedDay)}
              </p>
              <p className="text-lg font-bold tabular-nums">
                {selectedStart && timeLabel(selectedStart, locale)} – {selectedEnd && timeLabel(selectedEnd, locale)}
              </p>
              <Badge
                variant="outline"
                className="border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {duration} {t("scheduler.minutes")}
              </Badge>
              <Button variant="outline" className="w-full" onClick={() => setStep("schedule")}>
                {t("scheduler.changePeriod")}
              </Button>
            </aside>

            <section className="space-y-4 rounded-2xl border p-4">
              <div className="flex items-center gap-2 font-semibold">
                <UserRound className="h-4 w-4" /> {t("reservationForm.patient")}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={patientMode === "existing" ? "default" : "outline"} onClick={() => setPatientMode("existing")}>
                  {t("reservationForm.existing")}
                </Button>
                <Button variant={patientMode === "new" ? "default" : "outline"} onClick={() => setPatientMode("new")}>
                  {t("reservationForm.newProfile")}
                </Button>
              </div>

              {patientMode === "existing" ? (
                <div className="space-y-2">
                  <Label htmlFor="scheduler-patient-search">{t("reservationForm.searchPatient")}</Label>
                  <Input id="scheduler-patient-search" value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} />
                  <Select value={selectedPatientId || "none"} onValueChange={(value) => setSelectedPatientId(value === "none" ? "" : value)} disabled={patientsLoading}>
                    <SelectTrigger><SelectValue placeholder={t("reservationForm.selectPatient")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("reservationForm.selectPatient")}</SelectItem>
                      {filteredPatients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}{patient.phone ? ` — ${patient.phone}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="scheduler-name">{t("patients.name")} *</Label>
                    <Input id="scheduler-name" value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("patients.phone")} ({t("scheduler.optional")})</Label>
                    <PhoneCountryField
                      country={phoneCountry}
                      localNumber={phoneLocal}
                      onCountryChange={setPhoneCountry}
                      onLocalNumberChange={setPhoneLocal}
                      countryId="scheduler-country"
                      phoneId="scheduler-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduler-age">{t("patients.age")} ({t("scheduler.optional")})</Label>
                    <Input id="scheduler-age" type="number" min={1} value={age} onChange={(event) => setAge(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("patients.bloodType")} ({t("scheduler.optional")})</Label>
                    <Select value={bloodType} onValueChange={(value) => setBloodType(value as BloodType | "none")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {BLOOD_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="scheduler-xray">{t("patients.xrayOptional")}</Label>
                    <Input
                      id="scheduler-xray"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
                          toast.error(t("reservations.xrayTooLarge"))
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = () => typeof reader.result === "string" && setXrayImageBase64(reader.result)
                        reader.readAsDataURL(file)
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("scheduler.serviceType")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["dental", "laser"] as const).map((value) => (
                      <Button key={value} variant={serviceType === value ? "default" : "outline"} onClick={() => setServiceType(value)}>
                        {t(`scheduler.service.${value}`)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("reservations.bookingType")}</Label>
                  <Select value={bookingType} onValueChange={(value) => setBookingType(value as BookingType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(bookingTypeLabels) as BookingType[]).map((value) => (
                        <SelectItem key={value} value={value}>{bookingTypeLabels[value]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {inlineError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">{inlineError}</p>}
              <LoadingButton className="w-full" loading={isProcessing} onClick={() => void submit()}>
                {t("reservationForm.saveReservation")}
              </LoadingButton>
            </section>
          </div>
          )}
        </div>
      </DialogContent>
      <AlertDialog
        open={Boolean(reservationToCancel)}
        onOpenChange={(next) => {
          if (!next && !isProcessing) setReservationToCancel(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scheduler.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("scheduler.cancelDescription", {
                name: reservationToCancel?.patientName ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t("common:actions.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isProcessing}
              className="bg-red-700 text-white hover:bg-red-800 dark:bg-red-700 dark:text-white dark:hover:bg-red-600"
              onClick={(event) => {
                event.preventDefault()
                void cancelSelectedReservation()
              }}
            >
              {isProcessing ? t("common:actions.loading") : t("scheduler.confirmCancellation")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
