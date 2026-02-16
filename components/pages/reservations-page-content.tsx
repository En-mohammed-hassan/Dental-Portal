"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

import { PatientCard } from "@/components/reservations/patient-card"
import { PatientFormDialog } from "@/components/reservations/patient-form-dialog"
import { SectionContainer } from "@/components/reservations/section-container"
import { StatsSummary } from "@/components/reservations/stats-summary"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useReservationsStore } from "@/store/use-reservations-store"
import { type BookingType } from "@/types/patient"

const listAnimation = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
}

export function ReservationsPageContent() {
  const {
    currentPatient,
    waitingPatients,
    upcomingPatients,
    addReservation,
    markAsArrived,
    startTreatment,
    finishTreatment,
    cancelReservation,
    hydrate,
    errorMessage,
    isLoading,
    isProcessing,
  } = useReservationsStore()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<BookingType | "all">("all")
  const [pendingStartPatientId, setPendingStartPatientId] = useState<string | null>(null)
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false)
  const [feedbackDialogMessage, setFeedbackDialogMessage] = useState<string | null>(null)
  const [finishDialogOpen, setFinishDialogOpen] = useState(false)
  const [treatmentNote, setTreatmentNote] = useState("")
  const [xrayImageBase64, setXrayImageBase64] = useState<string | null>(null)
  const [xrayPreview, setXrayPreview] = useState<string | null>(null)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const matchesFilters = (name: string, phone: string, bookingType: BookingType) => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      name.toLowerCase().includes(normalizedSearch) ||
      phone.toLowerCase().includes(normalizedSearch)
    const matchesType = filterType === "all" || bookingType === filterType
    return matchesSearch && matchesType
  }

  const filteredWaiting = useMemo(
    () =>
      waitingPatients.filter((patient) =>
        matchesFilters(patient.name, patient.phone, patient.bookingType)
      ),
    [waitingPatients, searchTerm, filterType]
  )

  const filteredUpcoming = useMemo(
    () =>
      upcomingPatients.filter((patient) =>
        matchesFilters(patient.name, patient.phone, patient.bookingType)
      ),
    [upcomingPatients, searchTerm, filterType]
  )

  const emergencyCount = waitingPatients.filter(
    (patient) => patient.bookingType === "emergency"
  ).length

  const startTreatmentFlow = async (patientId: string) => {
    const success = await startTreatment(patientId, true)
    if (!success) {
      setFeedbackDialogMessage(
        useReservationsStore.getState().errorMessage ?? "Failed to start treatment."
      )
    }
  }

  const handleStartTreatment = async (patientId: string) => {
    if (currentPatient) {
      setPendingStartPatientId(patientId)
      setReplaceDialogOpen(true)
      return
    }
    await startTreatmentFlow(patientId)
  }

  const handleCancel = async (patientId: string) => {
    const canceled = await cancelReservation(patientId)
    if (!canceled) {
      setFeedbackDialogMessage(
        useReservationsStore.getState().errorMessage ??
          "Reservation cancellation was not allowed."
      )
    }
  }

  const handleFinishTreatment = async () => {
    const ok = await finishTreatment(treatmentNote, xrayImageBase64)
    if (!ok) {
      setFeedbackDialogMessage(
        useReservationsStore.getState().errorMessage ??
          "Failed to finish treatment. Please try again."
      )
      return
    }
    setFinishDialogOpen(false)
    setTreatmentNote("")
    setXrayImageBase64(null)
    setXrayPreview(null)
  }

  const handleXrayUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setFeedbackDialogMessage("Please choose a valid image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setFeedbackDialogMessage("X-ray image must be 2MB or smaller")
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setXrayImageBase64(reader.result)
          setXrayPreview(reader.result)
        }
      }
      reader.onerror = () => {
        setFeedbackDialogMessage("Failed to process image")
      }
      reader.readAsDataURL(file)
    } catch {
      setFeedbackDialogMessage("Failed to process image")
    }
  }

  return (
    <>
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reservations Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Manage treatment flow and queue status with a modern real-time board.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PatientFormDialog onSubmitReservation={addReservation} isProcessing={isProcessing} />
          </div>
        </div>
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <StatsSummary
          emergencyCount={emergencyCount}
          upcomingCount={upcomingPatients.length}
          waitingCount={waitingPatients.length}
        />
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          disabled={isLoading || isProcessing}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by name or phone"
          value={searchTerm}
        />
        <select
          className="ui-select"
          disabled={isLoading || isProcessing}
          onChange={(event) =>
            setFilterType((event.target.value || "all") as BookingType | "all")
          }
          value={filterType}
        >
          <option value="all">All Booking Types</option>
          <option value="advance">Advance</option>
          <option value="walk-in">Walk-in</option>
          <option value="emergency">Emergency</option>
        </select>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionContainer
          accentClassName="bg-green-600 text-white"
          count={currentPatient ? 1 : 0}
          title="Current Patient"
        >
          <AnimatePresence mode="popLayout">
            {currentPatient ? (
              <motion.div key={currentPatient.id} {...listAnimation}>
                <PatientCard
                  actionsDisabled={isLoading || isProcessing}
                  onFinishTreatment={() => setFinishDialogOpen(true)}
                  patient={currentPatient}
                  variant="current"
                />
              </motion.div>
            ) : (
              <motion.p
                key="no-current"
                className="text-muted-foreground text-sm"
                {...listAnimation}
              >
                No patient is currently in treatment.
              </motion.p>
            )}
          </AnimatePresence>
        </SectionContainer>

        <SectionContainer
          accentClassName="bg-amber-500 text-white"
          count={filteredWaiting.length}
          title="Waiting Patients"
        >
          <AnimatePresence mode="popLayout">
            {filteredWaiting.length ? (
              filteredWaiting.map((patient) => (
                <motion.div key={patient.id} layout {...listAnimation}>
                  <PatientCard
                    actionsDisabled={isLoading || isProcessing}
                    onCancel={handleCancel}
                    onStartTreatment={handleStartTreatment}
                    patient={patient}
                    variant="waiting"
                  />
                </motion.div>
              ))
            ) : (
              <motion.p
                key="no-waiting"
                className="text-muted-foreground text-sm"
                {...listAnimation}
              >
                No waiting patients match the current filters.
              </motion.p>
            )}
          </AnimatePresence>
        </SectionContainer>

        <SectionContainer
          accentClassName="bg-blue-600 text-white"
          count={filteredUpcoming.length}
          title="Upcoming Patients"
        >
          <AnimatePresence mode="popLayout">
            {filteredUpcoming.length ? (
              filteredUpcoming.map((patient) => (
                <motion.div key={patient.id} layout {...listAnimation}>
                  <PatientCard
                    actionsDisabled={isLoading || isProcessing}
                    onCancel={handleCancel}
                    onMarkAsArrived={(patientId) => void markAsArrived(patientId)}
                    patient={patient}
                    variant="upcoming"
                  />
                </motion.div>
              ))
            ) : (
              <motion.p
                key="no-upcoming"
                className="text-muted-foreground text-sm"
                {...listAnimation}
              >
                No upcoming patients match the current filters.
              </motion.p>
            )}
          </AnimatePresence>
        </SectionContainer>
      </section>

      <AlertDialog onOpenChange={setReplaceDialogOpen} open={replaceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current patient?</AlertDialogTitle>
            <AlertDialogDescription>
              A patient is currently being treated. If you continue, that patient
              will be moved back to the waiting list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStartPatientId(null)}>
              Keep Current
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStartPatientId) {
                  void startTreatmentFlow(pendingStartPatientId)
                }
                setPendingStartPatientId(null)
              }}
            >
              Replace & Start
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setFeedbackDialogMessage(null)
        }}
        open={Boolean(feedbackDialogMessage)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Action Required</AlertDialogTitle>
            <AlertDialogDescription>{feedbackDialogMessage ?? ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setFeedbackDialogMessage(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setFinishDialogOpen} open={finishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish treatment with required note</AlertDialogTitle>
            <AlertDialogDescription>
              Add a clear treatment summary. This note is required and saved in History.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="treatment-note">
                Treatment Note
              </label>
              <Textarea
                disabled={isProcessing}
                id="treatment-note"
                minLength={5}
                onChange={(event) => setTreatmentNote(event.target.value)}
                placeholder="Example: Tooth extraction completed. Prescribed pain medication and follow-up after 7 days."
                value={treatmentNote}
              />
              {treatmentNote.trim().length > 0 && treatmentNote.trim().length < 5 && (
                <p className="text-sm text-red-600">Note must be at least 5 characters.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="xray-image">
                X-ray Image (Optional)
              </label>
              <input
                accept="image/*"
                className="text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:text-sm file:font-medium file:cursor-pointer"
                disabled={isProcessing}
                id="xray-image"
                onChange={(event) => void handleXrayUpload(event)}
                type="file"
              />
              {xrayPreview && (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="X-ray preview"
                    className="h-32 w-32 rounded-md border object-cover"
                    src={xrayPreview}
                  />
                  <Button
                    disabled={isProcessing}
                    onClick={() => {
                      setXrayImageBase64(null)
                      setXrayPreview(null)
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Remove Image
                  </Button>
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="disabled:pointer-events-none disabled:opacity-50"
              disabled={treatmentNote.trim().length < 5}
              onClick={() => void handleFinishTreatment()}
            >
              {isProcessing ? "Saving..." : "Finish & Save Note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
