"use client"

import { format, parseISO, startOfDay, isBefore } from "date-fns"
import { Clock, Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

export type AdminBookableSlot = {
  id: string
  startsAt: string
  endsAt: string
  capacity: number
  label: string | null
  isActive: boolean
  remaining: number
}

type Props = {
  slots: AdminBookableSlot[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
  disabled?: boolean
}

export function AdminSlotPicker({
  slots,
  loading,
  selectedId,
  onSelect,
  disabled,
}: Props) {
  const today = useMemo(() => startOfDay(new Date()), [])

  const bookable = useMemo(() => {
    const now = Date.now()
    return slots.filter((s) => {
      if (!s.isActive || s.remaining <= 0) return false
      return parseISO(s.endsAt).getTime() > now
    })
  }, [slots])

  const byDay = useMemo(() => {
    const m = new Map<string, AdminBookableSlot[]>()
    for (const s of bookable) {
      const key = format(parseISO(s.startsAt), "yyyy-MM-dd")
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(s)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime())
    }
    return m
  }, [bookable])

  const dayKeys = useMemo(() => [...byDay.keys()].sort(), [byDay])

  const [activeDay, setActiveDay] = useState<string | null>(null)

  useEffect(() => {
    if (dayKeys.length === 0) {
      setActiveDay(null)
      return
    }
    setActiveDay((prev) => (prev && dayKeys.includes(prev) ? prev : dayKeys[0]))
  }, [dayKeys])

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading available slots…
      </div>
    )
  }

  if (bookable.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        No open slots with seats left. Add or activate slots in{" "}
        <strong>Admin → Website &amp; slots</strong> — patients see the same list on{" "}
        <strong>/book</strong>.
      </p>
    )
  }

  const slotsForDay = activeDay ? (byDay.get(activeDay) ?? []) : []

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Same rules as the public booking page: active slots that haven&apos;t ended, with at least one
        seat free.
      </p>
      <div className="flex flex-wrap gap-2">
        {dayKeys.map((key) => {
          const d = parseISO(`${key}T12:00:00`)
          const dayInPast = isBefore(startOfDay(d), today)
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => setActiveDay(key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeDay === key
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm dark:border-teal-500 dark:bg-teal-600"
                  : "border-slate-200 bg-white hover:border-teal-400/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-700",
                dayInPast && activeDay !== key && "opacity-80"
              )}
            >
              {format(d, "EEE, MMM d")}
            </button>
          )
        })}
      </div>
      <div className="grid max-h-[220px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {slotsForDay.map((s) => {
          const start = parseISO(s.startsAt)
          const end = parseISO(s.endsAt)
          const sel = selectedId === s.id
          return (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(sel ? null : s.id)}
              className={cn(
                "flex flex-col items-start rounded-xl border-2 p-3 text-left text-sm transition-all duration-200",
                sel
                  ? "border-teal-600 bg-teal-50 shadow-sm dark:border-teal-500 dark:bg-teal-950/40"
                  : "border-slate-200 hover:border-teal-400/70 dark:border-slate-700 dark:hover:border-teal-700"
              )}
            >
              <span className="flex items-center gap-1.5 font-semibold tabular-nums text-slate-900 dark:text-white">
                <Clock className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                {format(start, "HH:mm")} – {format(end, "HH:mm")}
              </span>
              <span className="text-muted-foreground mt-0.5 text-xs">
                {s.remaining} seat{s.remaining !== 1 ? "s" : ""} left
                {s.label ? ` · ${s.label}` : ""}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
