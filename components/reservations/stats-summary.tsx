"use client"

import { BarChart3, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsSummaryProps {
  waitingCount: number
  upcomingCount: number
  emergencyCount: number
}

export function StatsSummary({
  waitingCount,
  upcomingCount,
  emergencyCount,
}: StatsSummaryProps) {
  const { t } = useTranslation("admin")
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full justify-between rounded-xl px-3 sm:w-auto"
        aria-expanded={expanded}
        aria-controls="reservation-summary-cards"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {t("reservations.summaryTitle")}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {expanded ? t("reservations.hideSummary") : t("reservations.showSummary")}
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </span>
      </Button>

      {expanded && (
        <div id="reservation-summary-cards" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="gap-2 py-3 sm:py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-sm">{t("reservations.statsWaiting")}</p>
              <p className="text-2xl font-bold">{waitingCount}</p>
            </CardContent>
          </Card>
          <Card className="gap-2 py-3 sm:py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-sm">{t("reservations.statsUpcoming")}</p>
              <p className="text-2xl font-bold">{upcomingCount}</p>
            </CardContent>
          </Card>
          <Card className="gap-2 border-red-300 py-3 dark:border-red-900 sm:py-4">
            <CardContent className="px-4">
              <p className="text-muted-foreground text-sm">{t("reservations.statsEmergency")}</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{emergencyCount}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
