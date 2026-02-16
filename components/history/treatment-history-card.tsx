"use client"

import { useState } from "react"
import { Trash2, X } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useReservationsStore } from "@/store/use-reservations-store"
import { type Patient } from "@/types/patient"
import {
  bookingTypeBadgeClass,
  bookingTypeLabels,
  formatAppointmentDate,
} from "@/utils/patient"

interface TreatmentHistoryCardProps {
  record: Patient
}

export function TreatmentHistoryCard({ record }: TreatmentHistoryCardProps) {
  const { deleteReservationFromHistory, isProcessing } = useReservationsStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [xrayPreviewOpen, setXrayPreviewOpen] = useState(false)

  const handleDelete = async () => {
    const success = await deleteReservationFromHistory(record.id)
    if (success) {
      setDeleteDialogOpen(false)
    }
  }

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
              <span className="text-muted-foreground">Age:</span> {record.age}
            </p>
            <p>
              <span className="text-muted-foreground">Blood:</span> {record.bloodType}
            </p>
            <p className="col-span-2">
              <span className="text-muted-foreground">Completed:</span>{" "}
              {record.completedAt ? formatAppointmentDate(record.completedAt) : "-"}
            </p>
          </div>

          {record.xrayImageBase64 && (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                X-ray Image
              </p>
              <button
                className="cursor-zoom-in w-full"
                onClick={() => setXrayPreviewOpen(true)}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="X-ray"
                  className="h-32 w-full rounded-md border object-cover hover:opacity-90 transition-opacity"
                  src={record.xrayImageBase64}
                />
              </button>
            </div>
          )}

          <div className="rounded-md border bg-white/30 p-2 text-sm dark:bg-slate-900/30">
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
              Treatment Note
            </p>
            <p>{record.treatmentNote?.trim() || "No note provided."}</p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this reservation from history. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
              onClick={() => void handleDelete()}
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog onOpenChange={setXrayPreviewOpen} open={xrayPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>X-ray Image - {record.name}</DialogTitle>
            <DialogDescription>Click outside to close preview.</DialogDescription>
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
