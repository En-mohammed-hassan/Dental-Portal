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
  UserRound,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  type NewReservationInput,
  type PatientProfile,
  type ServiceType,
} from "@/types/patient"

type MonthCount = { date: string; reservationCount: number }

type Props = {
  onSubmitReservation: (payload: NewReservationInput) => Promise<void> | void
  onCancelReservation?: (reservationId: string) => Promise<boolean>
  controlledOpen?: boolean
  initialDay?: Date | null
  onDialogOpenChange?: (open: boolean) => void
  showTrigger?: boolean
  isProcessing?: boolean
}

function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function ReservationSchedulerDialog({
  onSubmitReservation,
  controlledOpen,
  initialDay = null,
  onDialogOpenChange,
  showTrigger = true,
  isProcessing = false,
}: Props) {
  const { t, i18n } = useTranslation(["admin", "common"])
  const [open, setOpen] = useState(false)
  const dialogOpen = controlledOpen ?? open
  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [monthLoading, setMonthLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [manualTime, setManualTime] = useState("")
  const [duration, setDuration] = useState("")
  const [note, setNote] = useState("")
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [name, setName] = useState("")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [serviceType, setServiceType] = useState<ServiceType>("dental")
  const [reminderId, setReminderId] = useState<string | undefined>()
  const [inlineError, setInlineError] = useState<string | null>(null)

  const reset = () => {
    setSelectedDay(null)
    setManualTime("")
    setDuration("")
    setNote("")
    setPatientMode("existing")
    setSelectedPatientId("")
    setPatientSearch("")
    setName("")
    setPhoneLocal("")
    setDocumentNumber("")
    setServiceType("dental")
    setReminderId(undefined)
    setInlineError(null)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("newReservation") === "1") {
      setSelectedPatientId(params.get("patientId") ?? "")
      setReminderId(params.get("reminderId") ?? undefined)
      setOpen(true)
      onDialogOpenChange?.(true)
    }
  }, [onDialogOpenChange])

  useEffect(() => {
    if (!dialogOpen || initialDay) return
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
  }, [dialogOpen, initialDay, month, t])

  useEffect(() => {
    if (!dialogOpen) return
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
  }, [dialogOpen, t])

  useEffect(() => {
    if (!dialogOpen || !initialDay) return
    setMonth(startOfMonth(initialDay))
    setSelectedDay(initialDay)
    setManualTime("")
    setInlineError(null)
  }, [dialogOpen, initialDay])

  const calendarDays = useMemo(() => {
    const first = startOfMonth(month)
    const next = startOfMonth(addMonths(month, 1))
    const days: Date[] = []
    for (let day = first; day < next; day = addDays(day, 1)) days.push(day)
    return { days, leading: getDay(first) }
  }, [month])

  const parsedDuration = useMemo(() => {
    if (!duration.trim()) return null
    const value = Number(duration)
    return Number.isInteger(value) && value > 0 && value <= 1440 ? value : Number.NaN
  }, [duration])

  const manualPeriod = useMemo(() => {
    if (!selectedDay || !manualTime) {
      return { start: null as Date | null, end: null as Date | null, error: null as string | null }
    }
    const match = /^(\d{2}):(\d{2})$/.exec(manualTime)
    if (!match) return { start: null, end: null, error: t("scheduler.invalidManualTime") }
    if (Number.isNaN(parsedDuration)) {
      return { start: null, end: null, error: t("scheduler.invalidDuration") }
    }

    const start = new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate(),
      Number(match[1]),
      Number(match[2]),
      0,
      0
    )
    if (start.getTime() <= Date.now()) {
      return { start: null, end: null, error: t("scheduler.futureTimeRequired") }
    }
    return {
      start,
      end: parsedDuration ? addMinutes(start, parsedDuration) : start,
      error: null,
    }
  }, [manualTime, parsedDuration, selectedDay, t])

  const filteredPatients = useMemo(() => {
    const search = patientSearch.trim().toLowerCase()
    if (!search) return patients
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(search) ||
        (patient.phone?.toLowerCase().includes(search) ?? false) ||
        (patient.documentNumber?.toLowerCase().includes(search) ?? false)
    )
  }, [patientSearch, patients])

  const submit = async () => {
    setInlineError(null)
    if (!manualPeriod.start) {
      setInlineError(manualPeriod.error ?? t("scheduler.selectTimeFirst"))
      return
    }
    if (Number.isNaN(parsedDuration)) {
      setInlineError(t("scheduler.invalidDuration"))
      return
    }
    if (note.trim().length > 500) {
      setInlineError(t("scheduler.noteTooLong"))
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
      if (phoneLocal.trim() && !/^0\d{9}$/.test(phoneLocal.trim())) {
        setInlineError(t("patients.phoneInvalid"))
        return
      }
      patient = {
        name: name.trim(),
        phone: phoneLocal.trim() || null,
        documentNumber: documentNumber.trim() || null,
      }
    }

    try {
      await onSubmitReservation({
        ...(patientMode === "existing" ? { patientId: selectedPatientId } : { patient }),
        bookingType: "advance",
        serviceType,
        appointmentDate: manualPeriod.start.toISOString(),
        durationMinutes: parsedDuration ?? undefined,
        note: note.trim() || null,
        reminderId,
      })
      setOpen(false)
      onDialogOpenChange?.(false)
      reset()
      if (window.location.search.includes("newReservation=1")) {
        window.history.replaceState({}, "", window.location.pathname)
      }
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : t("reservationForm.saveFailed"))
    }
  }

  const locale = i18n.language || "en"
  const todayKey = dateKey(new Date())

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(next) => {
        setOpen(next)
        onDialogOpenChange?.(next)
        if (!next) {
          reset()
          if (window.location.search.includes("newReservation=1")) {
            window.history.replaceState({}, "", window.location.pathname)
          }
        }
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <Button disabled={isProcessing}>
            <Plus className="me-2 h-4 w-4" />
            {t("reservationForm.addReservation")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className={cn(
          "flex max-h-[96dvh] flex-col gap-0 overflow-hidden p-0",
          initialDay ? "sm:max-w-2xl" : "sm:max-w-5xl"
        )}
      >
        <DialogHeader className="shrink-0 border-b px-4 py-3 pe-12 sm:px-5">
          <DialogTitle>{t("scheduler.title")}</DialogTitle>
          <DialogDescription>{t("scheduler.unifiedDescription")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className={cn("grid gap-3", !initialDay && "lg:grid-cols-[0.9fr_1.1fr]")}>
            {!initialDay && (
              <section className="space-y-3 rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setMonth((value) => subMonths(value, 1))}
                  >
                    <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                  <div className="text-center">
                    <p className="text-sm font-semibold">
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
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
                  {Array.from({ length: 7 }, (_, index) => (
                    <span key={index}>
                      {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2023, 0, 1 + index))}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
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
                        onClick={() => {
                          setSelectedDay(day)
                          setManualTime("")
                          setInlineError(null)
                        }}
                        className={cn(
                          "flex h-12 flex-col justify-between rounded-md border p-1 text-start transition",
                          selected
                            ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/15 dark:border-violet-400 dark:bg-violet-950/35"
                            : "border-border bg-background hover:border-violet-300 dark:hover:border-violet-700",
                          isToday && !selected && "border-blue-400 dark:border-blue-500"
                        )}
                      >
                        <span className="text-xs font-semibold">{format(day, "d")}</span>
                        <span className="self-end rounded-full bg-muted px-1.5 text-[9px] font-semibold tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            <section className="space-y-4 rounded-xl border bg-card p-3 sm:p-4">
              {!selectedDay ? (
                <div className="flex min-h-56 flex-col items-center justify-center text-center text-muted-foreground">
                  <CalendarDays className="mb-2 h-8 w-8" />
                  <p className="font-medium">{t("scheduler.chooseDay")}</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">{t("reservations.dayAgenda")}</p>
                    <p className="text-sm font-semibold capitalize">
                      {new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(selectedDay)}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="scheduler-manual-time">{t("scheduler.manualStartTime")} *</Label>
                      <div className="relative">
                        <Clock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="scheduler-manual-time"
                          type="time"
                          step={60}
                          value={manualTime}
                          onChange={(event) => setManualTime(event.target.value)}
                          className="h-11 ps-10 font-semibold tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="scheduler-duration">
                        {t("scheduler.durationMinutes")} ({t("scheduler.optional")})
                      </Label>
                      <Input
                        id="scheduler-duration"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={1440}
                        placeholder={t("scheduler.durationPlaceholder")}
                        value={duration}
                        onChange={(event) => setDuration(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("scheduler.manualTimeHint")}</p>
                  {manualPeriod.error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                      {manualPeriod.error}
                    </p>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="scheduler-note">
                      {t("scheduler.reservationNote")} ({t("scheduler.optional")})
                    </Label>
                    <Textarea
                      id="scheduler-note"
                      rows={2}
                      maxLength={500}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder={t("scheduler.reservationNotePlaceholder")}
                    />
                    <p className="text-end text-[10px] text-muted-foreground">{note.length}/500</p>
                  </div>

                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <UserRound className="h-4 w-4" /> {t("reservationForm.patient")}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={patientMode === "existing" ? "default" : "outline"}
                        onClick={() => setPatientMode("existing")}
                      >
                        {t("reservationForm.existing")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={patientMode === "new" ? "default" : "outline"}
                        onClick={() => setPatientMode("new")}
                      >
                        {t("reservationForm.newProfile")}
                      </Button>
                    </div>

                    {patientMode === "existing" ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          aria-label={t("reservationForm.searchPatient")}
                          value={patientSearch}
                          onChange={(event) => setPatientSearch(event.target.value)}
                          placeholder={t("reservationForm.searchPatient")}
                        />
                        <Select
                          value={selectedPatientId || "none"}
                          onValueChange={(value) => setSelectedPatientId(value === "none" ? "" : value)}
                          disabled={patientsLoading}
                        >
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
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder={`${t("patients.name")} *`}
                        />
                        <Input
                          inputMode="numeric"
                          autoComplete="tel-national"
                          maxLength={10}
                          value={phoneLocal}
                          onChange={(event) => setPhoneLocal(event.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder={t("patients.phoneHint")}
                        />
                        <Input
                          className="sm:col-span-2"
                          maxLength={50}
                          value={documentNumber}
                          onChange={(event) => setDocumentNumber(event.target.value)}
                          placeholder={t("patients.documentPlaceholder")}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t("scheduler.serviceType")}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["dental", "laser"] as const).map((value) => (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant={serviceType === value ? "default" : "outline"}
                          onClick={() => setServiceType(value)}
                        >
                          {t(`scheduler.service.${value}`)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {inlineError && (
                    <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
                      {inlineError}
                    </p>
                  )}
                  <LoadingButton
                    className="w-full"
                    loading={isProcessing}
                    disabled={!manualPeriod.start}
                    onClick={() => void submit()}
                  >
                    {t("reservationForm.saveReservation")}
                  </LoadingButton>
                </>
              )}
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
