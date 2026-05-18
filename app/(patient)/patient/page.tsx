"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Stagger, StaggerItem } from "@/components/motion/motion-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { parseLocale } from "@/lib/locale"
import { type Patient } from "@/types/patient"

export default function PatientHomePage() {
  const { t, i18n } = useTranslation(["patient", "common"])
  const locale = parseLocale(i18n.language)
  const [rows, setRows] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch("/api/patient/reservations", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setRows(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {t("portalTitle")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t("portalSubtitle")}</p>
        </div>
        <Button asChild className="rounded-full shadow-sm">
          <Link href="/book">{t("bookVisit")}</Link>
        </Button>
      </div>

      <Card className="border-slate-200/80 bg-white/80 dark:border-slate-800 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle>{t("upcoming")}</CardTitle>
          <CardDescription>{t("portalTitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">{t("actions.loading", { ns: "common" })}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noReservations")}</p>
          ) : (
            <Stagger className="space-y-3">
              {rows.map((r) => (
                <StaggerItem key={r.id}>
                  <div className="flex flex-col gap-1 rounded-xl border border-slate-200/80 px-4 py-3 transition-colors duration-200 hover:border-teal-300/60 dark:border-slate-800 dark:hover:border-teal-700/50">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatDate(r.appointmentDate, locale)}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {r.bookingType}
                      {r.treatmentNote ? ` · ${t("past")}` : ""}
                    </span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
