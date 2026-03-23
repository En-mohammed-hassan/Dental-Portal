"use client"

import Link from "next/link"
import {
  addMonths,
  format,
  isBefore,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Users } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Matcher } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type BookingSlot = {
  id: string
  startsAt: string
  endsAt: string
  label: string | null
  remaining: number
}

type Props = {
  slots: BookingSlot[]
  loading: boolean
  isPatient: boolean
  isStaff: boolean
  bookingId: string | null
  onBook: (slotId: string) => void
  authBanner: React.ReactNode
}

function dayKey(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

export function BookingCalendar({
  slots,
  loading,
  isPatient,
  isStaff,
  bookingId,
  onBook,
  authBanner,
}: Props) {
  const today = useMemo(() => startOfDay(new Date()), [])

  const slotsByDay = useMemo(() => {
    const map = new Map<string, BookingSlot[]>()
    for (const s of slots) {
      const start = parseISO(s.startsAt)
      const key = dayKey(start)
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(s)
    }
    for (const [, arr] of map) {
      arr.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    }
    return map
  }, [slots])

  const datesWithOpenSlots = useMemo(() => {
    const keys = [...slotsByDay.entries()]
      .filter(([, arr]) => arr.some((s) => s.remaining > 0))
      .map(([k]) => k)
    return keys.map((k) => parseISO(`${k}T12:00:00`))
  }, [slotsByDay])

  const datesFullOnly = useMemo(() => {
    const keys = [...slotsByDay.entries()]
      .filter(([, arr]) => arr.length > 0 && arr.every((s) => s.remaining === 0))
      .map(([k]) => k)
    return keys.map((k) => parseISO(`${k}T12:00:00`))
  }, [slotsByDay])

  const [selected, setSelected] = useState<Date | undefined>(undefined)
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()))
  /** After slots arrive, pick the first bookable day once (avoids stuck empty day if user clicked the calendar while slots were still loading). */
  const autoSelectedRef = useRef(false)

  useEffect(() => {
    if (slots.length === 0) {
      autoSelectedRef.current = false
    }
  }, [slots.length])

  useEffect(() => {
    if (loading || slots.length === 0 || autoSelectedRef.current) {
      return
    }
    const sorted = [...slots].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
    const first = sorted[0]
    if (first) {
      const d = startOfDay(parseISO(first.startsAt))
      setSelected(d)
      setMonth(startOfMonth(d))
      autoSelectedRef.current = true
    }
  }, [loading, slots])

  const slotsForSelectedDay = useMemo(() => {
    if (!selected) {
      return []
    }
    const key = dayKey(selected)
    return slotsByDay.get(key) ?? []
  }, [selected, slotsByDay])

  const disabledDays: Matcher = useCallback(
    (date: Date) => {
      const d = startOfDay(date)
      if (isBefore(d, today)) {
        return true
      }
      // Optional: grey out days with no slots (still clickable if we remove this)
      return false
    },
    [today]
  )

  const goPrevMonth = () => setMonth((m) => addMonths(m, -1))
  const goNextMonth = () => setMonth((m) => addMonths(m, 1))

  /** Last month shown in the picker (aligned with slot fetch window). */
  const lastBookableMonth = startOfMonth(addMonths(new Date(), 4))

  return (
    <div className="space-y-8">
      {authBanner}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,440px)_1fr] lg:items-start xl:gap-12">
        {/* Calendar column */}
        <Card className="overflow-hidden border-2 border-slate-200/90 bg-white/95 shadow-lg dark:border-slate-800 dark:bg-slate-950/80">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-teal-50/90 to-sky-50/50 pb-4 dark:border-slate-800 dark:from-teal-950/40 dark:to-slate-900/80">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <div>
                <CardTitle className="text-lg">Pick a date</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Teal = seats left; amber = that day is booked up. Pick a day, then choose a time.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center gap-2 text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading calendar…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-4 flex w-full max-w-sm items-center justify-between px-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={goPrevMonth}
                    disabled={isBefore(addMonths(month, -1), startOfMonth(today))}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <p className="text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                    {format(month, "MMMM yyyy")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={goNextMonth}
                    disabled={!isBefore(month, lastBookableMonth)}
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <div
                  className={cn(
                    "w-full max-w-[min(100%,380px)] rounded-2xl border border-slate-200/80 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-900/50",
                    "[--cell-size:2.75rem] sm:[--cell-size:3rem]"
                  )}
                >
                  <Calendar
                    mode="single"
                    month={month}
                    onMonthChange={setMonth}
                    selected={selected}
                    onSelect={setSelected}
                    disabled={disabledDays}
                    showOutsideDays
                    className="w-full rounded-xl [--cell-size:2.75rem] sm:[--cell-size:3.25rem]"
                    classNames={{
                      nav: "hidden",
                      day: cn(
                        "relative [&_button]:min-h-[--cell-size] [&_button]:text-sm sm:[&_button]:text-base"
                      ),
                    }}
                    modifiers={{
                      available: datesWithOpenSlots,
                      full: datesFullOnly,
                    }}
                    modifiersClassNames={{
                      available:
                        "font-semibold text-teal-800 dark:text-teal-200 [&_button]:bg-teal-100/90 dark:[&_button]:bg-teal-900/50 [&_button]:ring-2 [&_button]:ring-teal-400/60 dark:[&_button]:ring-teal-600/50",
                      full:
                        "font-medium text-slate-600 dark:text-slate-400 [&_button]:bg-amber-50/90 dark:[&_button]:bg-amber-950/40 [&_button]:ring-2 [&_button]:ring-amber-300/50 dark:[&_button]:ring-amber-800/50",
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-teal-500" aria-hidden />
                    Open slots
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                    Full (no seats)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Times column */}
        <div className="min-h-[280px] space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Clock className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-xl font-semibold tracking-tight">
              {selected
                ? format(selected, "EEEE, MMMM d")
                : "Choose a date"}
            </h2>
          </div>

          {!loading && slots.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                No open appointments yet
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                In <span className="font-medium text-slate-700 dark:text-slate-300">Admin → Website &amp; slots</span>, each row must show{" "}
                <span className="font-medium">Live on /book</span>: turn <strong>Active</strong> on and
                set the <strong>end</strong> time after the current time. If the list says{" "}
                <span className="font-medium">Ended</span> or <span className="font-medium">Off</span>, patients
                won&apos;t see that slot.
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                <a
                  href="/api/public/slots?diagnose=1"
                  className="font-medium text-teal-700 underline underline-offset-2 dark:text-teal-400"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open /api/public/slots?diagnose=1
                </a>{" "}
                (dev only) — check <code className="rounded bg-slate-200/80 px-1 dark:bg-slate-800">_diagnose</code>{" "}
                for row counts and whether <strong>endsAt</strong> is after server time. In DevTools → Network, use
                filter <strong>All</strong> or <strong>Fetch/XHR</strong> (not only Doc); the <code>/book</code> page
                loads slots as fetch, not as a full page navigation.
              </p>
            </div>
          )}

          {!loading && slots.length > 0 && selected && slotsForSelectedDay.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-slate-600 dark:text-slate-400">
                No times on this day. Pick another date highlighted on the calendar.
              </p>
            </div>
          )}

          {slotsForSelectedDay.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
              {slotsForSelectedDay.map((s) => {
                const start = parseISO(s.startsAt)
                const end = parseISO(s.endsAt)
                const busy = bookingId === s.id
                const full = s.remaining <= 0
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 p-6 shadow-md transition-all duration-300 ease-out motion-safe:hover:scale-[1.01]",
                      full
                        ? "border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-slate-50/80 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-950"
                        : "border-teal-200/90 bg-gradient-to-br from-teal-50 via-white to-sky-50/80 hover:border-teal-400/80 hover:shadow-lg dark:border-teal-900/60 dark:from-teal-950/50 dark:via-slate-900 dark:to-slate-950 dark:hover:border-teal-700",
                      "min-h-[200px] sm:min-h-[220px]"
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-4xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                            {format(start, "HH:mm")}
                          </p>
                          <p className="mt-1 text-lg font-medium text-slate-600 dark:text-slate-400">
                            to {format(end, "HH:mm")}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white/80 px-3 py-2 text-right text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-800/80 dark:text-slate-300">
                          <Users className="mx-auto mb-1 h-4 w-4 opacity-70" />
                          {full ? "Full" : `${s.remaining} left`}
                        </div>
                      </div>
                      {s.label ? (
                        <p className="mt-4 inline-flex rounded-full bg-teal-600/10 px-3 py-1 text-sm font-medium text-teal-800 dark:bg-teal-400/10 dark:text-teal-200">
                          {s.label}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="mt-6 h-12 w-full rounded-2xl text-base font-semibold shadow-sm"
                      disabled={full || busy || isStaff || !isPatient}
                      onClick={() => onBook(s.id)}
                      title={
                        full
                          ? "This slot is full"
                          : isStaff
                            ? "Staff book from the dashboard"
                            : !isPatient
                              ? "Sign in as a patient first"
                              : undefined
                      }
                    >
                      {busy ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Booking…
                        </>
                      ) : full ? (
                        "Fully booked"
                      ) : (
                        "Reserve this time"
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {!isPatient && !isStaff && slots.length > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <Link className="font-medium text-teal-700 underline dark:text-teal-400" href="/sign-in?mode=patient">
                Sign in as a patient
              </Link>{" "}
              to reserve.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
