"use client"

import {
  addDays,
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
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ReservationDetailsDialog,
  type ScheduleReservation,
} from "@/components/reservations/reservation-details-dialog"
import { cn } from "@/lib/utils"
import { type UpdateReservationInput } from "@/types/patient"
import {
  serviceTypeBadgeClass,
} from "@/utils/patient"

type MonthCount = {
  date: string
  reservationCount: number
}

type MonthSummary = {
  totalReservations: number
  upcomingReservations: number
  upcomingDental: number
  upcomingLaser: number
}

const EMPTY_MONTH_SUMMARY: MonthSummary = {
  totalReservations: 0,
  upcomingReservations: 0,
  upcomingDental: 0,
  upcomingLaser: 0,
}

type Props = {
  revision?: string
  onAddReservation?: (day: Date) => void
  onUpdateReservation: (
    reservationId: string,
    payload: UpdateReservationInput
  ) => Promise<boolean>
  onDeleteReservation: (reservationId: string) => Promise<boolean>
  isProcessing?: boolean
}

function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function dayRange(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return { from: from.toISOString(), to: addDays(from, 1).toISOString() }
}

function timeLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function ReservationCalendarView({
  revision = "",
  onAddReservation,
  onUpdateReservation,
  onDeleteReservation,
  isProcessing = false,
}: Props) {
  const { t, i18n } = useTranslation(["admin", "common"])
  const locale = i18n.language || "en"
  const today = useMemo(() => new Date(), [])
  const todayKey = dateKey(today)

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [monthSummary, setMonthSummary] = useState<MonthSummary>(EMPTY_MONTH_SUMMARY)
  const [appointments, setAppointments] = useState<ScheduleReservation[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<ScheduleReservation | null>(null)
  const [monthLoading, setMonthLoading] = useState(false)
  const [dayLoading, setDayLoading] = useState(false)
  const [monthError, setMonthError] = useState<string | null>(null)
  const [dayError, setDayError] = useState<string | null>(null)
  const [manualRefresh, setManualRefresh] = useState(0)

  const calendarDays = useMemo(() => {
    const first = startOfMonth(month)
    const next = startOfMonth(addMonths(month, 1))
    const days: Date[] = []
    for (let day = first; day < next; day = addDays(day, 1)) days.push(day)
    return { days, leading: getDay(first) }
  }, [month])

  useEffect(() => {
    const controller = new AbortController()
    const from = startOfMonth(month)
    const to = startOfMonth(addMonths(month, 1))

    setMonthLoading(true)
    setMonthError(null)
    void fetch(
      `/api/admin/schedule/month?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
      { credentials: "include", cache: "no-store", signal: controller.signal }
    )
      .then(async (response) => {
        const payload = (await response.json()) as {
          days?: MonthCount[]
          summary?: MonthSummary
          message?: string
        }
        if (!response.ok) {
          throw new Error(payload.message ?? t("scheduler.loadMonthFailed"))
        }
        setMonthCounts(
          Object.fromEntries((payload.days ?? []).map((day) => [day.date, day.reservationCount]))
        )
        setMonthSummary(payload.summary ?? EMPTY_MONTH_SUMMARY)
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setMonthCounts({})
        setMonthSummary(EMPTY_MONTH_SUMMARY)
        setMonthError(error instanceof Error ? error.message : t("scheduler.loadMonthFailed"))
      })
      .finally(() => {
        if (!controller.signal.aborted) setMonthLoading(false)
      })

    return () => controller.abort()
  }, [manualRefresh, month, revision, t])

  useEffect(() => {
    const controller = new AbortController()
    const range = dayRange(selectedDay)

    setDayLoading(true)
    setDayError(null)
    setAppointments([])
    void fetch(
      `/api/admin/schedule/day?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
      { credentials: "include", cache: "no-store", signal: controller.signal }
    )
      .then(async (response) => {
        const payload = (await response.json()) as {
          reservations?: ScheduleReservation[]
          message?: string
        }
        if (!response.ok) {
          throw new Error(payload.message ?? t("scheduler.loadDayFailed"))
        }
        setAppointments(payload.reservations ?? [])
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setAppointments([])
        setDayError(error instanceof Error ? error.message : t("scheduler.loadDayFailed"))
      })
      .finally(() => {
        if (!controller.signal.aborted) setDayLoading(false)
      })

    return () => controller.abort()
  }, [manualRefresh, revision, selectedDay, t])

  const chooseMonth = (nextMonth: Date) => {
    const first = startOfMonth(nextMonth)
    setMonth(first)
    setSelectedDay(first)
  }

  const chooseToday = () => {
    const value = new Date()
    setMonth(startOfMonth(value))
    setSelectedDay(value)
  }

  const selectedDayHasFutureTime =
    new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate() + 1
    ).getTime() > Date.now()

  const appointmentColumns = useMemo(() => {
    const firstColumnSize = Math.ceil(appointments.length / 2)
    return [
      appointments.slice(0, firstColumnSize),
      appointments.slice(firstColumnSize),
    ]
  }, [appointments])

  const refreshAfterChange = () => {
    setSelectedAppointment(null)
    setManualRefresh((value) => value + 1)
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{t("reservations.calendarTitle")}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("reservations.calendarSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={chooseToday}>
            {t("reservations.today")}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9"
            aria-label={t("reservations.refreshCalendar")}
            onClick={() => setManualRefresh((value) => value + 1)}
            disabled={monthLoading || dayLoading}
          >
            <RefreshCw className={cn("h-4 w-4", (monthLoading || dayLoading) && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div className="border-b p-3 sm:p-5 xl:border-b-0 xl:border-e">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Button
              size="icon"
              variant="outline"
              aria-label={t("reservations.previousMonth")}
              onClick={() => chooseMonth(subMonths(month, 1))}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <div className="text-center">
              <p className="font-semibold capitalize">
                {new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month)}
              </p>
              <p className="mx-auto mt-0.5 max-w-72 text-xs leading-relaxed text-muted-foreground">
                {t("reservations.monthUpcomingBreakdown", {
                  laser: monthSummary.upcomingLaser,
                  dental: monthSummary.upcomingDental,
                  upcoming: monthSummary.upcomingReservations,
                  total: monthSummary.totalReservations,
                })}
              </p>
            </div>
            <Button
              size="icon"
              variant="outline"
              aria-label={t("reservations.nextMonth")}
              onClick={() => chooseMonth(addMonths(month, 1))}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>

          {monthError && (
            <p className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {monthError}
            </p>
          )}

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground">
            {Array.from({ length: 7 }, (_, index) => (
              <span key={index} className="py-1">
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
              const count = monthCounts[key] ?? 0
              const selected = key === dateKey(selectedDay)
              const isToday = key === todayKey

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  aria-label={`${format(day, "PPP")}: ${count} ${t("scheduler.reservations")}`}
                  className={cn(
                    "group flex h-16 flex-col justify-between rounded-lg border p-1.5 text-start transition sm:h-20 sm:rounded-xl sm:p-2",
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
                        className="h-2 w-2 rounded-full bg-blue-500 ring-2 ring-blue-500/15"
                        title={t("reservations.today")}
                      />
                    )}
                  </span>
                  <span className="flex w-full justify-end">
                    <span
                      className={cn(
                        "inline-flex min-w-6 items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
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
        </div>

        <div className="min-w-0 bg-muted/20 p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("reservations.dayAgenda")}
              </p>
              <h3 className="mt-1 text-lg font-semibold capitalize">
                {new Intl.DateTimeFormat(locale, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(selectedDay)}
              </h3>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "border px-2 py-0.5 text-[11px] font-semibold",
                  appointments.length > 0
                    ? "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200"
                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                )}
              >
                {t("reservations.dayCount", { count: appointments.length })}
              </Badge>
              <Button
                type="button"
                size="sm"
                className="h-8 px-2.5 text-xs"
                disabled={!selectedDayHasFutureTime}
                onClick={() => onAddReservation?.(selectedDay)}
                title={!selectedDayHasFutureTime ? t("reservations.pastDayCannotAdd") : undefined}
              >
                <Plus className="me-1 h-3.5 w-3.5" />
                {t("reservationForm.addReservation")}
              </Button>
            </div>
          </div>

          {dayError ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              {dayError}
            </p>
          ) : dayLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 px-4 text-center">
              <CalendarDays className="mb-3 h-9 w-9 text-muted-foreground" />
              <p className="font-medium">{t("scheduler.noReservations")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("reservations.emptyDayHint")}
              </p>
            </div>
          ) : (
            <div className="grid max-h-[24rem] grid-cols-2 items-start gap-1.5 overflow-y-auto pe-1">
              {appointmentColumns.map((column, columnIndex) => (
                <div key={columnIndex} className="flex min-w-0 flex-col gap-1.5">
                  {column.map((appointment) => {
                    const start = new Date(appointment.startsAt)
                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        onClick={() => setSelectedAppointment(appointment)}
                        className="min-w-0 overflow-hidden rounded-md border bg-background p-1.5 text-start shadow-sm transition hover:border-primary/50 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        aria-label={t("reservationDetails.openLabel", {
                          name: appointment.patientName,
                          time: timeLabel(start, locale),
                        })}
                      >
                        <div className="flex min-w-0 items-center justify-between gap-1">
                          <p className="truncate text-xs font-bold tabular-nums">
                            {timeLabel(start, locale)}
                          </p>
                          {appointment.durationMinutes > 0 && (
                            <span className="shrink-0 text-[9px] text-muted-foreground">
                              {appointment.durationMinutes} {t("scheduler.min")}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex min-w-0 items-center justify-between gap-1 border-t pt-1">
                          <p className="min-w-0 truncate text-xs font-semibold">
                            <span>{appointment.patientName}</span>
                            {appointment.patientPhone && (
                              <>
                                <span> - </span>
                                <span dir="ltr">{appointment.patientPhone}</span>
                              </>
                            )}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 px-1 py-0 text-[8px]",
                              serviceTypeBadgeClass[appointment.serviceType]
                            )}
                          >
                            {t(`scheduler.service.${appointment.serviceType}`)}
                          </Badge>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ReservationDetailsDialog
        reservation={selectedAppointment}
        open={Boolean(selectedAppointment)}
        isProcessing={isProcessing}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedAppointment(null)
        }}
        onUpdate={onUpdateReservation}
        onDelete={onDeleteReservation}
        onChanged={refreshAfterChange}
      />
    </section>
  )
}
