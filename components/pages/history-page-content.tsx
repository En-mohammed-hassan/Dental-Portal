"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { TreatmentHistoryCard } from "@/components/history/treatment-history-card"
import { SectionContainer } from "@/components/reservations/section-container"
import { BookingTypeFilterSelect } from "@/components/ui/booking-type-filter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type BookingType, type Patient } from "@/types/patient"

const listAnimation = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
}

const PAGE_SIZE = 12

type HistoryApiData = {
  items: Patient[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function HistoryPageContent() {
  const { t } = useTranslation(["admin", "common"])
  const [historySearch, setHistorySearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [historyBookingType, setHistoryBookingType] = useState<BookingType | "all">("all")
  const [historyFromDate, setHistoryFromDate] = useState("")
  const [historyToDate, setHistoryToDate] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HistoryApiData>({
    items: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(historySearch.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [historySearch])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, historyBookingType, historyFromDate, historyToDate])

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        bookingType: historyBookingType,
      })
      if (debouncedSearch) {
        params.set("q", debouncedSearch)
      }
      if (historyFromDate) {
        params.set("completedFrom", historyFromDate)
      }
      if (historyToDate) {
        params.set("completedTo", historyToDate)
      }
      const res = await fetch(`/api/reservations/history?${params.toString()}`, {
        credentials: "include",
      })
      const json = (await res.json().catch(() => ({}))) as {
        data?: HistoryApiData
        message?: string
      }
      if (!res.ok) {
        throw new Error(json.message ?? t("history.loadFailed"))
      }
      if (!json.data) {
        throw new Error(t("history.invalidResponse"))
      }
      setData(json.data)
    } catch (e) {
      const message = e instanceof Error ? e.message : t("history.loadFailed")
      toast.error(message)
      setData({
        items: [],
        total: 0,
        page: 1,
        pageSize: PAGE_SIZE,
        totalPages: 1,
      })
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, historyBookingType, historyFromDate, historyToDate, t])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    if (page > data.totalPages && data.totalPages >= 1) {
      setPage(data.totalPages)
    }
  }, [page, data.totalPages])

  const fromIdx = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1
  const toIdx = Math.min(data.page * data.pageSize, data.total)

  return (
    <div className="space-y-8 pb-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("history.title")}</h2>
        <p className="text-muted-foreground text-sm">{t("history.subtitle")}</p>
      </div>

      <section
        aria-label="History filters"
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200/80 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-2 xl:grid-cols-4 xl:items-end"
      >
        <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
          <Label className="text-muted-foreground text-xs" htmlFor="history-search">
            {t("history.search")}
          </Label>
          <Input
            disabled={loading}
            id="history-search"
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder={t("history.searchPlaceholder")}
            value={historySearch}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs" htmlFor="history-booking">
            {t("history.bookingType")}
          </Label>
          <BookingTypeFilterSelect
            disabled={loading}
            id="history-booking"
            value={historyBookingType}
            onChange={(v) => setHistoryBookingType(v)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs" htmlFor="history-from">
            {t("history.completedFrom")}
          </Label>
          <Input
            disabled={loading}
            id="history-from"
            onChange={(event) => setHistoryFromDate(event.target.value)}
            type="date"
            value={historyFromDate}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs" htmlFor="history-to">
            {t("history.completedTo")}
          </Label>
          <Input
            disabled={loading}
            id="history-to"
            onChange={(event) => setHistoryToDate(event.target.value)}
            type="date"
            value={historyToDate}
          />
        </div>
      </section>

      <SectionContainer
        accentClassName="bg-violet-600 text-white"
        count={data.total}
        title={t("history.completedTreatments")}
      >
        <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            {loading
              ? t("history.loading")
              : data.total === 0
                ? t("history.noMatch")
                : t("history.showing", { from: fromIdx, to: toIdx, total: data.total })}
          </p>
          {data.totalPages > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                {t("common:actions.previous")}
              </Button>
              <span className="tabular-nums">
                {t("history.pageOf", { page, total: data.totalPages })}
              </span>
              <Button
                disabled={loading || page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                {t("common:actions.next")}
              </Button>
            </div>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {!loading && data.items.length ? (
            data.items.map((patient) => (
              <motion.div key={patient.id} layout {...listAnimation}>
                <TreatmentHistoryCard onDeleted={() => void loadHistory()} record={patient} />
              </motion.div>
            ))
          ) : !loading ? (
            <motion.p
              key="no-history"
              className="text-muted-foreground text-sm"
              {...listAnimation}
            >
              {t("history.noRecords")}
            </motion.p>
          ) : (
            <motion.p
              key="loading-history"
              className="text-muted-foreground text-sm"
              {...listAnimation}
            >
              {t("history.loadingHistory")}
            </motion.p>
          )}
        </AnimatePresence>
      </SectionContainer>
    </div>
  )
}
