"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

import { TreatmentHistoryCard } from "@/components/history/treatment-history-card"
import { Button } from "@/components/ui/button"
import { SectionContainer } from "@/components/reservations/section-container"
import { Input } from "@/components/ui/input"
import { useReservationsStore } from "@/store/use-reservations-store"
import { type BookingType } from "@/types/patient"

const listAnimation = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
}

export function HistoryPageContent() {
  const PAGE_SIZE = 6
  const { treatmentHistory, hydrate, isLoading, isProcessing } = useReservationsStore()
  const [historySearch, setHistorySearch] = useState("")
  const [historyBookingType, setHistoryBookingType] = useState<BookingType | "all">("all")
  const [historyFromDate, setHistoryFromDate] = useState("")
  const [historyToDate, setHistoryToDate] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const filteredHistory = useMemo(() => {
    return treatmentHistory.filter((patient) => {
      const query = historySearch.trim().toLowerCase()
      const matchesQuery =
        !query ||
        patient.name.toLowerCase().includes(query) ||
        patient.phone.toLowerCase().includes(query) ||
        (patient.treatmentNote ?? "").toLowerCase().includes(query)

      const matchesBooking =
        historyBookingType === "all" || patient.bookingType === historyBookingType

      const completedDate = patient.completedAt
        ? new Date(patient.completedAt).toISOString().slice(0, 10)
        : ""
      const matchesFrom = !historyFromDate || completedDate >= historyFromDate
      const matchesTo = !historyToDate || completedDate <= historyToDate

      return matchesQuery && matchesBooking && matchesFrom && matchesTo
    })
  }, [treatmentHistory, historySearch, historyBookingType, historyFromDate, historyToDate])

  useEffect(() => {
    setPage(1)
  }, [historySearch, historyBookingType, historyFromDate, historyToDate])

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE))
  const paginatedHistory = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredHistory.slice(start, start + PAGE_SIZE)
  }, [filteredHistory, page])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Treatment History</h2>
        <p className="text-muted-foreground text-sm">
          Review completed treatments with notes, search, and date filters.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          disabled={isLoading || isProcessing}
          onChange={(event) => setHistorySearch(event.target.value)}
          placeholder="Search by patient, phone, or note"
          value={historySearch}
        />
        <select
          className="ui-select"
          disabled={isLoading || isProcessing}
          onChange={(event) =>
            setHistoryBookingType((event.target.value || "all") as BookingType | "all")
          }
          value={historyBookingType}
        >
          <option value="all">All Booking Types</option>
          <option value="advance">Advance</option>
          <option value="walk-in">Walk-in</option>
          <option value="emergency">Emergency</option>
        </select>
        <Input
          disabled={isLoading || isProcessing}
          onChange={(event) => setHistoryFromDate(event.target.value)}
          type="date"
          value={historyFromDate}
        />
        <Input
          disabled={isLoading || isProcessing}
          onChange={(event) => setHistoryToDate(event.target.value)}
          type="date"
          value={historyToDate}
        />
      </section>

      <SectionContainer
        accentClassName="bg-violet-600 text-white"
        count={filteredHistory.length}
        title="Completed Treatments"
      >
        <AnimatePresence mode="popLayout">
          {paginatedHistory.length ? (
            paginatedHistory.map((patient) => (
              <motion.div key={patient.id} layout {...listAnimation}>
                <TreatmentHistoryCard record={patient} />
              </motion.div>
            ))
          ) : (
            <motion.p
              key="no-history"
              className="text-muted-foreground text-sm"
              {...listAnimation}
            >
              No history records match your filters.
            </motion.p>
          )}
        </AnimatePresence>
        {filteredHistory.length > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              size="sm"
              type="button"
              variant="outline"
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-muted-foreground text-xs">
              Page {page} / {totalPages}
            </span>
            <Button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              size="sm"
              type="button"
              variant="outline"
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </SectionContainer>
    </section>
  )
}
