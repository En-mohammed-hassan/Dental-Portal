"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

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
import { TeethTreatedPicker } from "@/components/dental/teeth-treated-picker"
import { BookingTypeFilterSelect } from "@/components/ui/booking-type-filter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PatientBillingPanel } from "@/components/billing/patient-billing-summary"
import { formatMoneyFromCents } from "@/lib/format"
import { majorUnitsToCents } from "@/lib/money"
import { parseLocale } from "@/lib/locale"
import { useReservationsStore } from "@/store/use-reservations-store"
import { type BookingType } from "@/types/patient"

const listAnimation = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.2 },
}

export function ReservationsPageContent() {
  const { t, i18n } = useTranslation(["admin", "common"])
  const locale = parseLocale(i18n.language)
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
  const [chargeInput, setChargeInput] = useState("")
  const [paymentInput, setPaymentInput] = useState("")
  const [canalsCount, setCanalsCount] = useState(0)
  const [teethTreated, setTeethTreated] = useState<string[]>([])
  const [procedureSummary, setProcedureSummary] = useState("")

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
        useReservationsStore.getState().errorMessage ?? t("reservations.startFailed")
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
        useReservationsStore.getState().errorMessage ?? t("reservations.cancelNotAllowed")
      )
    }
  }

  const currentTotalCharged = currentPatient?.totalChargedCents ?? 0
  const currentTotalPaid = currentPatient?.totalPaidCents ?? 0
  const currentBalanceCents = Math.max(
    0,
    currentTotalCharged - currentTotalPaid
  )

  const chargePreviewCents = useMemo(
    () => majorUnitsToCents(chargeInput) ?? 0,
    [chargeInput]
  )
  const paymentPreviewCents = useMemo(
    () => majorUnitsToCents(paymentInput) ?? 0,
    [paymentInput]
  )

  const projectedBalanceCents = useMemo(() => {
    return Math.max(0, currentBalanceCents + chargePreviewCents - paymentPreviewCents)
  }, [currentBalanceCents, chargePreviewCents, paymentPreviewCents])

  const handleFinishTreatment = async () => {
    const chargeCents = majorUnitsToCents(chargeInput)
    const paymentCents = majorUnitsToCents(paymentInput)

    if (chargeInput.trim() && chargeCents == null) {
      setFeedbackDialogMessage(t("reservations.feeInvalid"))
      return
    }
    if (paymentInput.trim() && paymentCents == null) {
      setFeedbackDialogMessage(t("reservations.feeInvalid"))
      return
    }

    const ok = await finishTreatment({
      treatmentNote,
      xrayImageBase64,
      chargeCents,
      paymentCents,
      canalsCount,
      teethTreated: teethTreated.length ? teethTreated : null,
      procedureSummary: procedureSummary.trim() || null,
    })
    if (!ok) {
      setFeedbackDialogMessage(
        useReservationsStore.getState().errorMessage ?? t("reservations.finishFailed")
      )
      return
    }
    setFinishDialogOpen(false)
    setTreatmentNote("")
    setXrayImageBase64(null)
    setXrayPreview(null)
    setChargeInput("")
    setPaymentInput("")
    setCanalsCount(0)
    setTeethTreated([])
    setProcedureSummary("")
  }

  const handleXrayUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setFeedbackDialogMessage(t("reservations.imageInvalid"))
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setFeedbackDialogMessage(t("reservations.xrayTooLarge"))
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
        setFeedbackDialogMessage(t("reservations.imageProcessFailed"))
      }
      reader.readAsDataURL(file)
    } catch {
      setFeedbackDialogMessage(t("reservations.imageProcessFailed"))
    }
  }

  return (
    <div className="space-y-8 pb-4">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("reservations.title")}</h1>
            <p className="text-muted-foreground text-sm">{t("reservations.subtitle")}</p>
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

      <section
        aria-label="Queue filters"
        className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200/80 bg-white/60 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-2 md:items-end"
      >
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs" htmlFor="queue-search">
            {t("reservations.search")}
          </Label>
          <Input
            disabled={isLoading || isProcessing}
            id="queue-search"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("reservations.searchPlaceholder")}
            value={searchTerm}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs" htmlFor="queue-booking-type">
            {t("reservations.bookingType")}
          </Label>
          <BookingTypeFilterSelect
            disabled={isLoading || isProcessing}
            id="queue-booking-type"
            value={filterType}
            onChange={(v) => setFilterType(v)}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionContainer
          accentClassName="bg-green-600 text-white"
          count={currentPatient ? 1 : 0}
          title={t("reservations.currentPatient")}
        >
          <AnimatePresence mode="popLayout">
            {currentPatient ? (
              <div key={currentPatient.id} {...listAnimation}>
                <PatientCard
                  actionsDisabled={isLoading || isProcessing}
                  onFinishTreatment={() => setFinishDialogOpen(true)}
                  patient={currentPatient}
                  variant="current"
                />
              </div>
            ) : (
              <motion.p
                key="no-current"
                className="text-muted-foreground text-sm"
                {...listAnimation}
              >
                {t("reservations.noCurrent")}
              </motion.p>
            )}
          </AnimatePresence>
        </SectionContainer>

        <SectionContainer
          accentClassName="bg-amber-500 text-white"
          count={filteredWaiting.length}
          title={t("reservations.waitingPatients")}
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
                {t("reservations.noWaiting")}
              </motion.p>
            )}
          </AnimatePresence>
        </SectionContainer>

        <SectionContainer
          accentClassName="bg-blue-600 text-white"
          count={filteredUpcoming.length}
          title={t("reservations.upcomingPatients")}
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
                {t("reservations.noUpcoming")}
              </motion.p>
            )}
          </AnimatePresence>
        </SectionContainer>
      </section>

      <AlertDialog onOpenChange={setReplaceDialogOpen} open={replaceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reservations.replaceTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("reservations.replaceDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStartPatientId(null)}>
              {t("reservations.keepCurrent")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStartPatientId) {
                  void startTreatmentFlow(pendingStartPatientId)
                }
                setPendingStartPatientId(null)
              }}
            >
              {t("reservations.replaceStart")}
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
            <AlertDialogTitle>{t("reservations.actionRequired")}</AlertDialogTitle>
            <AlertDialogDescription>{feedbackDialogMessage ?? ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setFeedbackDialogMessage(null)}>
              {t("reservations.ok")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={setFinishDialogOpen} open={finishDialogOpen}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reservations.finishTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("reservations.finishDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="treatment-note">
                {t("reservations.treatmentNote")}
              </label>
              <Textarea
                disabled={isProcessing}
                id="treatment-note"
                minLength={5}
                onChange={(event) => setTreatmentNote(event.target.value)}
                placeholder={t("reservations.treatmentNotePlaceholder")}
                value={treatmentNote}
              />
              {treatmentNote.trim().length > 0 && treatmentNote.trim().length < 5 && (
                <p className="text-sm text-red-600">{t("reservations.noteMinLength")}</p>
              )}
            </div>

            <PatientBillingPanel
              totalChargedCents={currentTotalCharged + chargePreviewCents}
              totalPaidCents={currentTotalPaid + paymentPreviewCents}
              balanceDueCents={currentBalanceCents}
              projectedBalanceCents={projectedBalanceCents}
              locale={locale}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="procedure-summary">{t("reservations.procedureShort")}</Label>
                <Input
                  disabled={isProcessing}
                  id="procedure-summary"
                  maxLength={120}
                  onChange={(e) => setProcedureSummary(e.target.value)}
                  placeholder={t("reservations.procedurePlaceholder")}
                  value={procedureSummary}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="charge-input">{t("reservations.treatmentCharge")}</Label>
                <Input
                  disabled={isProcessing}
                  id="charge-input"
                  inputMode="decimal"
                  onChange={(e) => setChargeInput(e.target.value)}
                  placeholder={t("reservations.treatmentChargePlaceholder")}
                  value={chargeInput}
                />
                <p className="text-muted-foreground text-xs">{t("reservations.chargeHint")}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-input">{t("reservations.paymentReceived")}</Label>
                <Input
                  disabled={isProcessing}
                  id="payment-input"
                  inputMode="decimal"
                  onChange={(e) => setPaymentInput(e.target.value)}
                  placeholder={t("reservations.paymentReceivedPlaceholder")}
                  value={paymentInput}
                />
                <p className="text-muted-foreground text-xs">{t("reservations.paymentHint")}</p>
              </div>
            </div>

            <div className="space-y-2 sm:max-w-xs">
              <Label htmlFor="canals-count">{t("reservations.canalsCount")}</Label>
              <Input
                disabled={isProcessing}
                id="canals-count"
                max={8}
                min={0}
                type="number"
                value={Number.isNaN(canalsCount) ? 0 : canalsCount}
                onChange={(e) => setCanalsCount(Math.min(8, Math.max(0, Number(e.target.value) || 0)))}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>

            <TeethTreatedPicker
              disabled={isProcessing}
              value={teethTreated}
              onChange={setTeethTreated}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="xray-image">
                {t("reservations.xrayOptional")}
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
                    alt={t("reservations.xrayPreviewAlt")}
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
                    {t("reservations.removeImage")}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common:actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="disabled:pointer-events-none disabled:opacity-50"
              disabled={isProcessing || treatmentNote.trim().length < 5}
              onClick={() => void handleFinishTreatment()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("common:actions.loading")}
                </>
              ) : (
                t("reservations.finishSave")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
