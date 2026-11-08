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
  Clock3,
  Loader2,
  Phone,
  RefreshCw,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBookingTypeLabels } from "@/lib/i18n/use-admin-labels"
import { cn } from "@/lib/utils"
import {
  type BookingType,
  type ReservationStatus,
  type ServiceType,
} from "@/types/patient"
import {
  bookingTypeBadgeClass,
  reservationStatusBadgeClass,
  serviceTypeBadgeClass,
} from "@/utils/patient"

type DayAppointment = {
  id: string
  patientId: string
  patientName: string
  patientPhone: string | null
  bookingType: BookingType
  status: ReservationStatus
  startsAt: string
  endsAt: string
  durationMinutes: number
  serviceType: ServiceType
}

type MonthCount = {
  date: string
  reservationCount: number
}

type Props = {
  revision?: string
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

export function ReservationCalendarView({ revision = "" }: Props) {
  const { t, i18n } = useTranslation(["admin", "common"])
  const bookingTypeLabels = useBookingTypeLabels()
  const locale = i18n.language || "en"
  const today = useMemo(() => new Date(), [])
  const todayKey = dateKey(today)

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [appointments, setAppointments] = useState<DayAppointment[]>([])
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
        const payload = (await response.json()) as { days?: MonthCount[]; message?: string }
        if (!response.ok) {
          throw new Error(payload.message ?? t("scheduler.loadMonthFailed"))
        }
        setMonthCounts(
          Object.fromEntries((payload.days ?? []).map((day) => [day.date, day.reservationCount]))
        )
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setMonthCounts({})
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
          reservations?: DayAppointment[]
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
              <p className="text-xs text-muted-foreground">
                {t("reservations.monthCount", {
                  count: Object.values(monthCounts).reduce((sum, count) => sum + count, 0),
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

        <div className="min-h-[28rem] bg-muted/20 p-3 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
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
            <Badge
              variant="outline"
              className={cn(
                "border px-2.5 py-1 font-semibold",
                appointments.length > 0
                  ? "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-800 dark:bg-violet-950/70 dark:text-violet-200"
                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              )}
            >
              {t("reservations.dayCount", { count: appointments.length })}
            </Badge>
          </div>

          {dayError ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              {dayError}
            </p>
          ) : dayLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 px-6 text-center">
              <CalendarDays className="mb-3 h-9 w-9 text-muted-foreground" />
              <p className="font-medium">{t("scheduler.noReservations")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("reservations.emptyDayHint")}
              </p>
            </div>
          ) : (
            <div className="max-h-[32rem] space-y-2 overflow-y-auto pe-1">
              {appointments.map((appointment) => {
                const start = new Date(appointment.startsAt)
                const end = new Date(appointment.endsAt)
                return (
                  <article
                    key={appointment.id}
                    className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-xl border bg-background p-3 shadow-sm"
                  >
                    <div className="border-e pe-3 text-center">
                      <p className="font-semibold tabular-nums">{timeLabel(start, locale)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {timeLabel(end, locale)}
                      </p>
                      <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        {appointment.durationMinutes} {t("scheduler.min")}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{appointment.patientName}</p>
                          {appointment.patientPhone && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground" dir="ltr">
                              <Phone className="h-3 w-3" />
                              {appointment.patientPhone}
                            </p>
                          )}
                        </div>
                        <Badge className={reservationStatusBadgeClass[appointment.status]} variant="outline">
                          {t(`linkedReservations.status${appointment.status.charAt(0).toUpperCase()}${appointment.status.slice(1)}`)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge
                          variant="outline"
                          className={serviceTypeBadgeClass[appointment.serviceType]}
                        >
                          {t(`scheduler.service.${appointment.serviceType}`)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={bookingTypeBadgeClass[appointment.bookingType]}
                        >
                          {bookingTypeLabels[appointment.bookingType]}
                        </Badge>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
