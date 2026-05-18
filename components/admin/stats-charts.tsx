"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatDate, formatMoneyFromCents } from "@/lib/format"
import { parseLocale } from "@/lib/locale"
import type { StatsPeriod, StatsTimeSeriesPoint } from "@/lib/server/stats-service"
import { cn } from "@/lib/utils"

const MASK = "••••••"

type Props = {
  series: StatsTimeSeriesPoint[]
  period: StatsPeriod
  locked: boolean
}

function formatBucketLabel(dateIso: string, period: StatsPeriod, locale: ReturnType<typeof parseLocale>) {
  const d = new Date(dateIso)
  if (period === "year") {
    return formatDate(d, locale, { month: "short" })
  }
  if (period === "week") {
    return formatDate(d, locale, { weekday: "short" })
  }
  return formatDate(d, locale, { day: "numeric", month: "short" })
}

export function StatsCharts({ series, period, locked }: Props) {
  const { t, i18n } = useTranslation("admin")
  const locale = parseLocale(i18n.language)

  const chartData = useMemo(
    () =>
      series.map((point) => ({
        ...point,
        label: formatBucketLabel(point.date, period, locale),
        charged: point.chargedCents / 100,
        paid: point.paidCents / 100,
      })),
    [series, period, locale]
  )

  const scrollableChart = chartData.length > 7
  const chartInnerMinWidth = scrollableChart ? Math.max(280, chartData.length * 36) : undefined

  const activityConfig = {
    patients: {
      label: t("stats.chartPatients"),
      color: "hsl(var(--chart-1))",
    },
    completed: {
      label: t("stats.chartCompleted"),
      color: "hsl(var(--chart-2))",
    },
  }

  const financialConfig = {
    charged: {
      label: t("stats.chartCharged"),
      color: "hsl(var(--chart-3))",
    },
    paid: {
      label: t("stats.chartPaid"),
      color: "hsl(var(--chart-4))",
    },
  }

  const xAxisProps = {
    dataKey: "label" as const,
    tickLine: false,
    axisLine: false,
    tickMargin: 8,
    minTickGap: 4,
    tick: { fontSize: 10 },
    interval: scrollableChart ? 0 : ("preserveStartEnd" as const),
    angle: period === "month" || chartData.length > 10 ? -40 : 0,
    textAnchor: period === "month" || chartData.length > 10 ? ("end" as const) : ("middle" as const),
    height: period === "month" || chartData.length > 10 ? 56 : 32,
  }

  return (
    <section className={cn("grid min-w-0 gap-4 lg:grid-cols-2", locked && "select-none")}>
      <ChartPanel title={t("stats.chartActivityTitle")} locked={locked}>
        <ResponsiveChartWrapper scrollable={scrollableChart} minWidth={chartInnerMinWidth}>
          <ChartContainer
            config={activityConfig}
            className="aspect-auto h-[240px] w-full min-w-0 max-w-full sm:h-[280px]"
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
              barCategoryGap="18%"
              barGap={2}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      locked ? MASK : String(value),
                      activityConfig[name as keyof typeof activityConfig]?.label ?? name,
                    ]}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
              <Bar dataKey="patients" fill="var(--color-patients)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
        </ResponsiveChartWrapper>
      </ChartPanel>

      <ChartPanel title={t("stats.chartFinancialTitle")} locked={locked}>
        <ResponsiveChartWrapper scrollable={scrollableChart} minWidth={chartInnerMinWidth}>
          <ChartContainer
            config={financialConfig}
            className="aspect-auto h-[240px] w-full min-w-0 max-w-full sm:h-[280px]"
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 4, left: -4, bottom: 0 }}
              barCategoryGap="18%"
              barGap={2}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis {...xAxisProps} />
              <YAxis tickLine={false} axisLine={false} width={36} tick={{ fontSize: 10 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (locked) return [MASK, name]
                      const cents = Math.round(Number(value) * 100)
                      return [
                        formatMoneyFromCents(cents, locale),
                        financialConfig[name as keyof typeof financialConfig]?.label ?? name,
                      ]
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
              <Bar dataKey="charged" fill="var(--color-charged)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="paid" fill="var(--color-paid)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartContainer>
        </ResponsiveChartWrapper>
      </ChartPanel>
    </section>
  )
}

function ResponsiveChartWrapper({
  children,
  scrollable,
  minWidth,
}: {
  children: ReactNode
  scrollable: boolean
  minWidth?: number
}) {
  if (!scrollable) {
    return <div className="min-w-0 w-full max-w-full overflow-hidden">{children}</div>
  }

  return (
    <div className="-mx-1 w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain px-1 pb-1">
      <div className="w-full" style={{ minWidth: minWidth ? `${minWidth}px` : undefined }}>
        {children}
      </div>
    </div>
  )
}

function ChartPanel({
  title,
  locked,
  children,
}: {
  title: string
  locked: boolean
  children: ReactNode
}) {
  return (
    <div className="relative min-w-0 max-w-full">
      <div className="min-w-0 overflow-hidden rounded-xl border bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <h3 className={cn("mb-3 text-sm font-semibold sm:text-base", locked && "blur-sm")}>{title}</h3>
        <div className={cn("min-w-0", locked && "blur-md")}>{children}</div>
      </div>
      {locked && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-white/40 dark:bg-slate-950/40" />
      )}
    </div>
  )
}
