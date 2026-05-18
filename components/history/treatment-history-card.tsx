"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TeethTreatedPicker } from "@/components/dental/teeth-treated-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useBookingTypeLabels } from "@/lib/i18n/use-admin-labels"
import { formatMoneyFromCents } from "@/lib/format"
import { parseLocale } from "@/lib/locale"
import { useReservationsStore } from "@/store/use-reservations-store"
import { type Patient } from "@/types/patient"
import { bookingTypeBadgeClass, formatAppointmentDate } from "@/utils/patient"

interface TreatmentHistoryCardProps {
  record: Patient
  onDeleted?: () => void
}

function formatFee(cents: number | null | undefined) {
  if (cents == null) return null
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function TreatmentHistoryCard({ record, onDeleted }: TreatmentHistoryCardProps) {
  const { t, i18n } = useTranslation(["admin", "common"])
  const locale = parseLocale(i18n.language)
  const bookingTypeLabels = useBookingTypeLabels()
  const { deleteReservationFromHistory, isProcessing } = useReservationsStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [xrayPreviewOpen, setXrayPreviewOpen] = useState(false)

  const handleDelete = async () => {
    const success = await deleteReservationFromHistory(record.id)
    if (success) {
      setDeleteDialogOpen(false)
      onDeleted?.()
    }
  }

  const feeLabel = formatFee(record.feeCents ?? record.chargeCents)
  const chargeLabel = formatFee(record.chargeCents ?? record.feeCents)
  const paymentLabel = formatFee(record.paymentCents)

  return (
    <>
      <Card className="from-card to-card/70 border-primary/10 overflow-hidden bg-gradient-to-br py-0">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold truncate">{record.name}</h3>
              <p className="text-muted-foreground text-sm truncate">{record.phone}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={bookingTypeBadgeClass[record.bookingType]}>
                {bookingTypeLabels[record.bookingType]}
              </Badge>
              <Button
                disabled={isProcessing}
                onClick={() => setDeleteDialogOpen(true)}
                size="sm"
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("reservations.age")}:</span> {record.age}
            </p>
            <p>
              <span className="text-muted-foreground">{t("reservations.blood")}:</span>{" "}
              {record.bloodType}
            </p>
            <p className="col-span-2">
              <span className="text-muted-foreground">{t("reservations.completed")}:</span>{" "}
              {record.completedAt ? formatAppointmentDate(record.completedAt) : "-"}
            </p>
          </div>

          {record.xrayImageBase64 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                {t("history.xrayImage")}
              </p>
              <button
                className="cursor-zoom-in w-full"
                onClick={() => setXrayPreviewOpen(true)}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("history.xrayImage")}
                  className="h-32 w-full rounded-md border object-cover hover:opacity-90 transition-opacity"
                  src={record.xrayImageBase64}
                />
              </button>
            </div>
          )}

          {(record.procedureSummary || record.canalsCount != null || record.teethTreated?.length) && (
            <div className="grid grid-cols-1 gap-2 rounded-md border bg-white/40 p-2 text-sm dark:bg-slate-900/30 sm:grid-cols-2">
              {record.procedureSummary ? (
                <p>
                  <span className="text-muted-foreground">{t("history.procedure")}:</span>{" "}
                  {record.procedureSummary}
                </p>
              ) : null}
              {record.canalsCount != null ? (
                <p>
                  <span className="text-muted-foreground">{t("history.canals")}:</span>{" "}
                  {record.canalsCount}
                </p>
              ) : null}
              {record.teethTreated && record.teethTreated.length > 0 ? (
                <div className="space-y-2 sm:col-span-2">
                  <p>
                    <span className="text-muted-foreground">{t("history.teethFdi")}:</span>{" "}
                    {record.teethTreated.join(", ")}
                  </p>
                  <TeethTreatedPicker
                    readOnly
                    value={record.teethTreated}
                    onChange={() => undefined}
                    triggerLabel={t("history.openToothChart")}
                    title={t("history.toothChartTitle", { name: record.name })}
                    description={t("history.toothChartDesc")}
                  />
                </div>
              ) : null}
            </div>
          )}

          {(chargeLabel || paymentLabel || record.balanceAfterCents != null) && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {chargeLabel ? (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                  {t("billing.sessionCharge")}: {chargeLabel}
                </span>
              ) : null}
              {paymentLabel ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                  {t("billing.sessionPayment")}: {paymentLabel}
                </span>
              ) : null}
              {record.balanceAfterCents != null ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                  {t("billing.balanceAfter")}: {formatMoneyFromCents(record.balanceAfterCents, locale)}
                </span>
              ) : null}
            </div>
          )}

          <div className="rounded-md border bg-white/30 p-2 text-sm dark:bg-slate-900/30">
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
              {t("history.treatmentNote")}
            </p>
            <p>{record.treatmentNote?.trim() || t("history.noNote")}</p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("history.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("history.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
              onClick={() => void handleDelete()}
            >
              {isProcessing ? t("patients.deleting") : t("common:actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog onOpenChange={setXrayPreviewOpen} open={xrayPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("history.xrayTitle", { name: record.name })}</DialogTitle>
            <DialogDescription>{t("patients.closePreview")}</DialogDescription>
          </DialogHeader>
          {record.xrayImageBase64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`${record.name} X-ray`}
              className="max-h-[70vh] w-full rounded-lg border object-contain"
              src={record.xrayImageBase64}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
