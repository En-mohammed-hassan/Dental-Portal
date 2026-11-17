"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  CalendarDays,
  Clock3,
  FileImage,
  FileText,
  Loader2,
  Stethoscope,
  WalletCards,
} from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { PatientBillingPanel } from "@/components/billing/patient-billing-summary"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate, formatMoneyFromCents } from "@/lib/format"
import { intlLocale, parseLocale } from "@/lib/locale"
import { cn } from "@/lib/utils"
import { type PatientProfile } from "@/types/patient"
import { reservationStatusBadgeClass } from "@/utils/patient"

interface LinkedReservationsDialogProps {
  patient: PatientProfile | null
  open: boolean
  loading?: boolean
  onOpenChange: (open: boolean) => void
}

type LinkedReservation = NonNullable<PatientProfile["linkedReservations"]>[number]

const cardAnimation = {
  initial: { opacity: 0, y: 8, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={cn("min-w-0 rounded-lg border bg-background/70 px-3 py-2.5", className)}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-foreground">{value}</dd>
    </div>
  )
}

export function LinkedReservationsDialog({
  patient,
  open,
  loading = false,
  onOpenChange,
}: LinkedReservationsDialogProps) {
  const { t, i18n } = useTranslation("admin")
  const locale = parseLocale(i18n.language)
  const reservations = patient?.linkedReservations ?? []
  const hasReservations = reservations.length > 0
  const [previewXray, setPreviewXray] = useState<{ image: string; name: string } | null>(null)
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale(locale), {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  )

  const bookingTypeLabel = (reservation: LinkedReservation) => {
    const key = reservation.bookingType === "walk-in" ? "walkIn" : reservation.bookingType
    return t(`bookingTypes.${key}`)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader className="border-b px-4 py-4 text-start sm:px-6">
          <DialogTitle className="pe-8 text-lg sm:text-xl">
            {t("linkedReservations.title", {
              name: patient?.name ?? t("linkedReservations.titleFallback"),
            })}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {loading
              ? t("linkedReservations.loadingDetails")
              : hasReservations
                ? t(
                    reservations.length === 1
                      ? "linkedReservations.countDesc"
                      : "linkedReservations.countDescPlural",
                    { count: reservations.length }
                  )
                : t("linkedReservations.emptyDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {patient ? (
            <PatientBillingPanel
              totalChargedCents={patient.totalChargedCents ?? 0}
              totalPaidCents={patient.totalPaidCents ?? 0}
              balanceDueCents={patient.balanceDueCents ?? 0}
              locale={locale}
              className="mb-4 text-start"
            />
          ) : null}

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-reservations"
                className="flex min-h-56 flex-col items-center justify-center gap-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t("linkedReservations.loadingDetails")}
                </p>
              </motion.div>
            ) : hasReservations ? (
              <motion.div
                key="reservations-list"
                className="space-y-4 pb-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, staggerChildren: 0.04 }}
              >
                {reservations.map((reservation, index) => {
                  const start = new Date(reservation.appointmentDate)
                  const end = new Date(reservation.endsAt)
                  const isUpcoming = start.getTime() > Date.now()
                  const chargeCents = reservation.chargeCents ?? reservation.feeCents ?? null
                  const hasClinicalDetails = Boolean(
                    reservation.treatmentNote?.trim() ||
                      reservation.procedureSummary?.trim() ||
                      reservation.canalsCount != null ||
                      reservation.teethTreated?.length ||
                      reservation.xrayImageBase64
                  )
                  const hasFinancialDetails =
                    chargeCents != null ||
                    reservation.paymentCents != null ||
                    reservation.balanceAfterCents != null ||
                    reservation.paymentStatus != null

                  return (
                    <motion.article
                      key={reservation.id}
                      className="overflow-hidden rounded-xl border bg-card shadow-sm"
                      {...cardAnimation}
                      transition={{ duration: 0.2, delay: index * 0.025 }}
                    >
                      <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/35 px-3 py-3 sm:px-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold capitalize leading-6">
                            {formatDate(reservation.appointmentDate, locale, {
                              weekday: "long",
                              month: "long",
                            })}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5 shrink-0" />
                            <span dir="ltr">
                              {timeFormatter.format(start)}
                              {reservation.durationMinutes > 0
                                ? ` – ${timeFormatter.format(end)} (${reservation.durationMinutes} ${t("scheduler.min")})`
                                : ` · ${t("reservationDetails.noPeriod")}`}
                            </span>
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "shrink-0 border font-medium",
                            isUpcoming
                              ? reservationStatusBadgeClass.upcoming
                              : reservationStatusBadgeClass.completed
                          )}
                          variant="outline"
                        >
                          {isUpcoming
                            ? t("linkedReservations.timeStatusUpcoming")
                            : t("linkedReservations.timeStatusPassed")}
                        </Badge>
                      </header>

                      <div className="space-y-3 p-3 sm:p-4">
                        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <DetailItem
                            label={t("reservationDetails.date")}
                            value={formatDate(reservation.appointmentDate, locale, {
                              weekday: "short",
                            })}
                          />
                          <DetailItem
                            label={t("reservationDetails.timeAndPeriod")}
                            value={
                              <span dir="ltr">
                                {timeFormatter.format(start)}
                                {reservation.durationMinutes > 0
                                  ? ` · ${reservation.durationMinutes} ${t("scheduler.min")}`
                                  : " · —"}
                              </span>
                            }
                          />
                          <DetailItem
                            label={t("scheduler.serviceType")}
                            value={t(`scheduler.service.${reservation.serviceType}`)}
                          />
                          <DetailItem
                            label={t("reservations.bookingType")}
                            value={bookingTypeLabel(reservation)}
                          />
                        </dl>

                        <section className="rounded-lg border border-amber-300/70 bg-amber-50/80 p-3 text-amber-950 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100">
                          <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                            <FileText className="h-4 w-4 shrink-0" />
                            <h4>{t("reservationDetails.noteTitle")}</h4>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {reservation.note?.trim() || t("reservationDetails.noNote")}
                          </p>
                        </section>

                        {hasClinicalDetails ? (
                          <section className="rounded-lg border bg-muted/20 p-3">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                              <Stethoscope className="h-4 w-4 text-primary" />
                              <h4>{t("linkedReservations.treatmentDetails")}</h4>
                            </div>

                            {(reservation.procedureSummary ||
                              reservation.canalsCount != null ||
                              reservation.teethTreated?.length) && (
                              <dl className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {reservation.procedureSummary ? (
                                  <DetailItem
                                    label={t("history.procedure")}
                                    value={reservation.procedureSummary}
                                  />
                                ) : null}
                                {reservation.canalsCount != null ? (
                                  <DetailItem
                                    label={t("history.canals")}
                                    value={reservation.canalsCount}
                                  />
                                ) : null}
                                {reservation.teethTreated?.length ? (
                                  <DetailItem
                                    label={t("history.teethFdi")}
                                    value={reservation.teethTreated.join(", ")}
                                  />
                                ) : null}
                              </dl>
                            )}

                            <div className="rounded-lg bg-background/70 p-3 text-sm">
                              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {t("history.treatmentNote")}
                              </p>
                              <p className="whitespace-pre-wrap break-words leading-6">
                                {reservation.treatmentNote?.trim() || t("history.noNote")}
                              </p>
                            </div>

                            {reservation.xrayImageBase64 ? (
                              <button
                                className="mt-3 flex w-full items-center gap-3 rounded-lg border bg-background/70 p-2 text-start transition-colors hover:border-primary/50 hover:bg-primary/5"
                                onClick={() =>
                                  setPreviewXray({
                                    image: reservation.xrayImageBase64!,
                                    name: `${patient?.name ?? t("linkedReservations.titleFallback")} - ${formatDate(reservation.appointmentDate, locale, { weekday: "long" })}`,
                                  })
                                }
                                type="button"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  alt={t("history.xrayImage")}
                                  className="h-14 w-14 shrink-0 rounded-md border object-cover"
                                  src={reservation.xrayImageBase64}
                                />
                                <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                                  <FileImage className="h-4 w-4 shrink-0 text-primary" />
                                  {t("history.xrayImage")}
                                </span>
                              </button>
                            ) : null}
                          </section>
                        ) : null}

                        {hasFinancialDetails ? (
                          <section className="rounded-lg border bg-muted/20 p-3">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                              <WalletCards className="h-4 w-4 text-primary" />
                              <h4>{t("linkedReservations.paymentDetails")}</h4>
                            </div>
                            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {chargeCents != null ? (
                                <DetailItem
                                  label={t("billing.sessionCharge")}
                                  value={formatMoneyFromCents(chargeCents, locale)}
                                />
                              ) : null}
                              {reservation.paymentCents != null ? (
                                <DetailItem
                                  label={t("billing.sessionPayment")}
                                  value={formatMoneyFromCents(reservation.paymentCents, locale)}
                                />
                              ) : null}
                              {reservation.balanceAfterCents != null ? (
                                <DetailItem
                                  label={t("billing.balanceAfter")}
                                  value={formatMoneyFromCents(reservation.balanceAfterCents, locale)}
                                />
                              ) : null}
                              {reservation.paymentStatus ? (
                                <DetailItem
                                  label={t("linkedReservations.paymentStatus")}
                                  value={t(`paymentStatus.${reservation.paymentStatus}`)}
                                />
                              ) : null}
                            </dl>
                          </section>
                        ) : null}

                        <footer className="flex flex-col gap-1 border-t pt-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-between">
                          <span>
                            {t("linkedReservations.created")}: {formatDate(reservation.createdAt, locale, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {reservation.completedAt ? (
                            <span>
                              {t("reservations.completed")}: {formatDate(reservation.completedAt, locale, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : null}
                        </footer>
                      </div>
                    </motion.article>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="no-reservations"
                className="flex min-h-56 flex-col items-center justify-center py-8 text-center"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
              >
                <div className="mb-4 rounded-full bg-muted p-4">
                  <CalendarDays className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  {t("linkedReservations.noReservations")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("linkedReservations.noReservationsDesc")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>

      <Dialog
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewXray(null)
        }}
        open={Boolean(previewXray)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewXray?.name ?? t("linkedReservations.xrayPreview")}</DialogTitle>
            <DialogDescription>{t("patients.closePreview")}</DialogDescription>
          </DialogHeader>
          {previewXray ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={t("reservations.xrayPreviewAlt")}
              className="max-h-[70vh] w-full rounded-lg border object-contain"
              src={previewXray.image}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
