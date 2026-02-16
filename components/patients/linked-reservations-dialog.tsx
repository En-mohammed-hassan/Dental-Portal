"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { Calendar, Clock, FileText, UserCheck, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type PatientProfile } from "@/types/patient"
import { bookingTypeLabels, formatAppointmentDate } from "@/utils/patient"

interface LinkedReservationsDialogProps {
  patient: PatientProfile | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const reservationStatusConfig: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  current: {
    label: "Current",
    className: "bg-green-600 text-white border-transparent",
    icon: <Clock className="h-3 w-3" />,
  },
  waiting: {
    label: "Waiting",
    className: "bg-amber-500 text-white border-transparent",
    icon: <Clock className="h-3 w-3" />,
  },
  upcoming: {
    label: "Upcoming",
    className: "bg-blue-600 text-white border-transparent",
    icon: <Calendar className="h-3 w-3" />,
  },
  completed: {
    label: "Completed",
    className: "bg-slate-500 text-white border-transparent",
    icon: <UserCheck className="h-3 w-3" />,
  },
}

const bookingTypeConfig: Record<string, { label: string; className: string }> = {
  advance: {
    label: "Advance",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700",
  },
  "walk-in": {
    label: "Walk-in",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600",
  },
  emergency: {
    label: "Emergency",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700",
  },
}

const cardAnimation = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
}

const containerAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15, staggerChildren: 0.05 },
}

export function LinkedReservationsDialog({
  patient,
  open,
  onOpenChange,
}: LinkedReservationsDialogProps) {
  const reservations = patient?.linkedReservations ?? []
  const hasReservations = reservations.length > 0
  const [previewXray, setPreviewXray] = useState<{ image: string; name: string } | null>(null)

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {patient?.name ?? "Patient"} Linked Reservations
          </DialogTitle>
          <DialogDescription className="text-sm">
            {hasReservations
              ? `Viewing ${reservations.length} reservation${reservations.length !== 1 ? "s" : ""} for this patient.`
              : "Reservation records connected to this patient profile."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          <AnimatePresence mode="wait">
            {hasReservations ? (
              <motion.div
                key="reservations-list"
                className="space-y-3 pb-2"
                {...containerAnimation}
              >
                {reservations.map((reservation, index) => {
                  const statusConfig = reservationStatusConfig[reservation.status] ?? {
                    label: reservation.status,
                    className: "bg-slate-500 text-white border-transparent",
                    icon: null,
                  }
                  const bookingConfig = bookingTypeConfig[reservation.bookingType] ?? {
                    label: bookingTypeLabels[reservation.bookingType] ?? reservation.bookingType,
                    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                  }

                  return (
                    <motion.div
                      key={reservation.id}
                      className="bg-muted/40 hover:bg-muted/60 rounded-lg border p-4 transition-colors"
                      {...cardAnimation}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], delay: index * 0.03 }}
                    >
                      <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Header with badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={`${statusConfig.className} flex items-center gap-1.5 text-xs font-medium`}
                              variant="secondary"
                            >
                              {statusConfig.icon}
                              {statusConfig.label}
                            </Badge>
                            <Badge
                              className={`${bookingConfig.className} text-xs font-medium border`}
                              variant="outline"
                            >
                              {bookingConfig.label}
                            </Badge>
                          </div>
                          {reservation.completedAt && (
                            <span className="text-muted-foreground text-xs">
                              Completed{" "}
                              {new Date(reservation.completedAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>

                        {/* Appointment details */}
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                            <span className="text-muted-foreground">Appointment:</span>
                            <span className="font-medium">
                              {formatAppointmentDate(reservation.appointmentDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserCheck className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                            <span className="text-muted-foreground">Arrived:</span>
                            <span className={reservation.hasArrived ? "font-medium text-green-600 dark:text-green-400" : "font-medium text-slate-500"}>
                              {reservation.hasArrived ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>

                        {/* X-ray Image */}
                        {reservation.xrayImageBase64 && (
                          <motion.div
                            className="mt-2 space-y-2"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.2, delay: 0.1 }}
                          >
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              X-ray Image
                            </p>
                            <button
                              className="cursor-zoom-in w-full"
                              onClick={() =>
                                setPreviewXray({
                                  image: reservation.xrayImageBase64!,
                                  name: `${patient?.name ?? "Patient"} - ${formatAppointmentDate(reservation.appointmentDate)}`,
                                })
                              }
                              type="button"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                alt="X-ray"
                                className="h-32 w-full rounded-md border object-cover hover:opacity-90 transition-opacity"
                                src={reservation.xrayImageBase64}
                              />
                            </button>
                          </motion.div>
                        )}

                        {/* Treatment note */}
                        {reservation.treatmentNote && (
                          <motion.div
                            className="mt-2 rounded-md border-l-4 border-primary/50 bg-primary/5 p-3"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.2, delay: 0.15 }}
                          >
                            <div className="flex items-start gap-2">
                              <FileText className="text-primary h-4 w-4 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-primary mb-1">Treatment Note</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                                  {reservation.treatmentNote}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Created date */}
                        <div className="pt-2 border-t">
                          <p className="text-muted-foreground text-xs">
                            Created: {new Date(reservation.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="no-reservations"
                className="flex flex-col items-center justify-center py-12 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-muted rounded-full p-4 mb-4">
                  <Calendar className="text-muted-foreground h-8 w-8" />
                </div>
                <p className="text-muted-foreground text-sm font-medium mb-1">
                  No reservations found
                </p>
                <p className="text-muted-foreground text-xs">
                  This patient doesn't have any linked reservations yet.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>

      {/* X-ray Preview Dialog */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) setPreviewXray(null)
        }}
        open={Boolean(previewXray)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewXray?.name ?? "X-ray Preview"}</DialogTitle>
            <DialogDescription>Click outside to close preview.</DialogDescription>
          </DialogHeader>
          {previewXray && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="X-ray preview"
              className="max-h-[70vh] w-full rounded-lg border object-contain"
              src={previewXray.image}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
