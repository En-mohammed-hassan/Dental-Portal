"use client"

import { Eye, EyeOff, Lock, TrendingUp } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { StatsCharts } from "@/components/admin/stats-charts"
import { StatsPageSkeleton } from "@/components/admin/stats-page-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatDate, formatMoneyFromCents, formatNumber } from "@/lib/format"
import { parseLocale } from "@/lib/locale"
import type { AdminStatsPayload, StatsPeriod } from "@/lib/server/stats-service"
import { cn } from "@/lib/utils"

const MASK = "••••••"

type StatsStatus = {
  configured: boolean
  unlocked: boolean
}

function StatCard({
  label,
  value,
  sub,
  locked,
  accent,
}: {
  label: string
  value: string
  sub?: string
  locked: boolean
  accent?: string
}) {
  return (
    <Card className="relative overflow-hidden border-white/60 bg-white/80 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-3xl",
            accent,
            locked && "select-none blur-md"
          )}
        >
          {locked ? MASK : value}
        </p>
        {sub && (
          <p className={cn("mt-1 text-xs text-slate-500", locked && "select-none blur-sm")}>
            {locked ? MASK : sub}
          </p>
        )}
      </CardContent>
      {locked && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-white/30 dark:to-slate-950/30" />
      )}
    </Card>
  )
}

function PeriodTabs({
  period,
  onChange,
  labels,
  disabled,
}: {
  period: StatsPeriod
  onChange: (p: StatsPeriod) => void
  labels: Record<StatsPeriod, string>
  disabled?: boolean
}) {
  const options: StatsPeriod[] = ["week", "month", "year"]
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch]">
      <div className="inline-flex w-max min-w-full rounded-full border bg-white/80 p-1 shadow-sm dark:bg-slate-900/75 sm:min-w-0">
      {options.map((p) => (
        <button
          key={p}
          type="button"
          disabled={disabled}
          onClick={() => onChange(p)}
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm",
            period === p
              ? "bg-primary text-primary-foreground"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          {labels[p]}
        </button>
      ))}
      </div>
    </div>
  )
}

export function StatsPageContent() {
  const { t, i18n } = useTranslation("admin")
  const locale = parseLocale(i18n.language)

  const [period, setPeriod] = useState<StatsPeriod>("month")
  const [status, setStatus] = useState<StatsStatus>({ configured: true, unlocked: false })
  const [stats, setStats] = useState<AdminStatsPayload | null>(null)
  const [ready, setReady] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [unlocking, setUnlocking] = useState(false)

  const locked = !status.unlocked

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/admin/stats/status", { credentials: "include" })
    const json = (await res.json().catch(() => ({}))) as { data?: StatsStatus }
    if (res.ok && json.data) {
      setStatus(json.data)
      return json.data
    }
    return null
  }, [])

  const fetchStats = useCallback(
    async (targetPeriod: StatsPeriod) => {
      const res = await fetch(`/api/admin/stats?period=${targetPeriod}`, {
        credentials: "include",
      })
      const json = (await res.json().catch(() => ({}))) as {
        data?: AdminStatsPayload
        message?: string
        code?: string
      }
      if (res.status === 403 && json.code === "STATS_LOCKED") {
        setStats(null)
        setStatus((s) => ({ ...s, unlocked: false }))
        return
      }
      if (!res.ok) {
        throw new Error(json.message ?? t("stats.loadFailed"))
      }
      setStats(json.data ?? null)
    },
    [t]
  )

  const refreshPage = useCallback(async () => {
    setReady(false)
    try {
      const s = await loadStatus()
      if (s?.unlocked) {
        await fetchStats(period)
      } else {
        setStats(null)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t("stats.loadFailed")
      toast.error(message)
      setStats(null)
    } finally {
      setReady(true)
    }
  }, [loadStatus, fetchStats, period, t])

  useEffect(() => {
    void refreshPage()
  }, [refreshPage])

  const handleUnlock = async () => {
    if (!password.trim()) return
    setUnlocking(true)
    setReady(false)
    try {
      const res = await fetch("/api/admin/stats/unlock", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const json = (await res.json().catch(() => ({}))) as { message?: string; code?: string }
      if (!res.ok) {
        if (json.code === "STATS_NOT_CONFIGURED") {
          throw new Error(t("stats.notConfigured"))
        }
        throw new Error(json.message ?? t("stats.wrongPassword"))
      }
      setPassword("")
      setPasswordOpen(false)
      setStatus((s) => ({ ...s, unlocked: true }))
      toast.success(t("stats.unlocked"))
      await fetchStats(period)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("stats.wrongPassword"))
    } finally {
      setUnlocking(false)
      setReady(true)
    }
  }

  const handleLock = async () => {
    setReady(false)
    await fetch("/api/admin/stats/unlock", { method: "DELETE", credentials: "include" })
    setStatus((s) => ({ ...s, unlocked: false }))
    setStats(null)
    toast.success(t("stats.locked"))
    setReady(true)
  }

  const rangeLabel =
    stats && !locked
      ? `${formatDate(stats.range.from, locale)} — ${formatDate(stats.range.to, locale)}`
      : ""

  const periodLabels: Record<StatsPeriod, string> = {
    week: t("stats.periodWeek"),
    month: t("stats.periodMonth"),
    year: t("stats.periodYear"),
  }

  const fmtMoney = (cents: number) => formatMoneyFromCents(cents, locale)
  const fmtNum = (n: number) => formatNumber(n, locale)

  if (!ready) {
    return <StatsPageSkeleton />
  }

  return (
    <div className="min-w-0 max-w-full space-y-8 overflow-x-hidden pb-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium text-primary dark:bg-slate-900/60">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("stats.badge")}
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("stats.title")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {t("stats.subtitle")}
          </p>
          {!locked && rangeLabel && (
            <p className="mt-2 text-xs text-slate-500">{rangeLabel}</p>
          )}
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <PeriodTabs period={period} onChange={setPeriod} labels={periodLabels} />
          {status.unlocked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => void handleLock()}
            >
              <EyeOff className="me-1.5 h-4 w-4" />
              {t("stats.hide")}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => setPasswordOpen(true)}
              disabled={!status.configured}
            >
              <Eye className="me-1.5 h-4 w-4" />
              {t("stats.show")}
            </Button>
          )}
        </div>
      </div>

      {!status.configured && (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/40">
          <CardContent className="flex items-start gap-3 py-4 text-sm text-amber-900 dark:text-amber-200">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{t("stats.envHint")}</p>
          </CardContent>
        </Card>
      )}

      {locked && status.configured && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
              {t("stats.lockedHint")}
            </p>
            <Button type="button" onClick={() => setPasswordOpen(true)}>
              <Eye className="me-1.5 h-4 w-4" />
              {t("stats.unlockButton")}
            </Button>
          </CardContent>
        </Card>
      )}

      {!locked && stats?.series && stats.series.length > 0 && (
        <StatsCharts series={stats.series} period={period} locked={locked} />
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.patientsAdded")}
          value={stats ? fmtNum(stats.patientsAdded) : "0"}
          locked={locked}
        />
        <StatCard
          label={t("stats.reservationsCreated")}
          value={stats ? fmtNum(stats.reservationsCreated) : "0"}
          locked={locked}
        />
        <StatCard
          label={t("stats.reservationsCompleted")}
          value={stats ? fmtNum(stats.reservationsCompleted) : "0"}
          locked={locked}
        />
        <StatCard
          label={t("stats.totalCanals")}
          value={stats ? fmtNum(stats.totalCanalsTreated) : "0"}
          locked={locked}
        />
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">{t("stats.financialTitle")}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("stats.totalCharged")}
            value={stats ? fmtMoney(stats.totalChargedCents) : fmtMoney(0)}
            locked={locked}
            accent="text-emerald-700 dark:text-emerald-400"
          />
          <StatCard
            label={t("stats.totalPaid")}
            value={stats ? fmtMoney(stats.totalPaidCents) : fmtMoney(0)}
            locked={locked}
            accent="text-sky-700 dark:text-sky-400"
          />
          <StatCard
            label={t("stats.outstanding")}
            value={stats ? fmtMoney(stats.outstandingBalanceCents) : fmtMoney(0)}
            sub={
              stats
                ? t("stats.patientsWithBalance", { count: stats.patientsWithBalance })
                : undefined
            }
            locked={locked}
            accent="text-amber-700 dark:text-amber-400"
          />
          <StatCard
            label={t("stats.avgCharge")}
            value={stats ? fmtMoney(stats.avgChargePerVisitCents) : fmtMoney(0)}
            locked={locked}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("stats.activeNowTitle")}</CardTitle>
          </CardHeader>
          <CardContent
            className={cn("grid grid-cols-3 gap-3 text-center", locked && "blur-md select-none")}
          >
            <div>
              <p className="text-2xl font-bold">
                {locked ? MASK : fmtNum(stats?.activeNow.current ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">{t("stats.current")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {locked ? MASK : fmtNum(stats?.activeNow.waiting ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">{t("stats.waiting")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {locked ? MASK : fmtNum(stats?.activeNow.upcoming ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">{t("stats.upcoming")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("stats.bookingTypeTitle")}</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-2 text-sm", locked && "blur-md select-none")}>
            <div className="flex justify-between">
              <span>{t("bookingTypes.advance")}</span>
              <span className="font-semibold">
                {locked ? MASK : fmtNum(stats?.byBookingType.advance ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("bookingTypes.walkIn")}</span>
              <span className="font-semibold">
                {locked ? MASK : fmtNum(stats?.byBookingType.walkIn ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("bookingTypes.emergency")}</span>
              <span className="font-semibold">
                {locked ? MASK : fmtNum(stats?.byBookingType.emergency ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("stats.paymentBreakdownTitle")}</CardTitle>
          </CardHeader>
          <CardContent
            className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", locked && "blur-md select-none")}
          >
            {(
              [
                ["unpaid", t("paymentStatus.unpaid")],
                ["partial", t("paymentStatus.partial")],
                ["paid", t("paymentStatus.paid")],
                ["unset", t("paymentStatus.none")],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="rounded-lg border bg-muted/30 px-3 py-2 text-center">
                <p className="text-lg font-bold">
                  {locked ? MASK : fmtNum(stats?.completedByPaymentStatus[key] ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("stats.passwordTitle")}</DialogTitle>
            <DialogDescription>{t("stats.passwordDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="stats-password">{t("stats.passwordLabel")}</Label>
            <Input
              id="stats-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleUnlock()
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>
              {t("reservations.cancel")}
            </Button>
            <Button
              type="button"
              disabled={unlocking || !password}
              onClick={() => void handleUnlock()}
            >
              {unlocking ? t("actions.loading") : t("stats.unlockButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
