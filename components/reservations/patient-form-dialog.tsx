"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useEffect, useMemo, useState } from "react"
import { type CountryCode } from "libphonenumber-js"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import {
  AdminSlotPicker,
  type AdminBookableSlot,
} from "@/components/reservations/admin-slot-picker"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneCountryField } from "@/components/ui/phone-country-field"
import {
  buildE164FromCountryAndLocal,
  isValidForCountry,
  splitPhoneToCountryAndLocal,
} from "@/lib/phone"
import { useBookingTypeLabels } from "@/lib/i18n/use-admin-labels"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BLOOD_TYPES,
  BOOKING_TYPES,
  type BookingType,
  type NewReservationInput,
  type PatientProfile,
} from "@/types/patient"

interface PatientFormDialogProps {
  onSubmitReservation: (payload: NewReservationInput) => Promise<void> | void
  isProcessing?: boolean
}

const reservationDetailsSchema = z.object({
  bookingType: z.enum(BOOKING_TYPES, {
    error: "Please select a booking type",
  }),
  appointmentDate: z
    .string()
    .optional()
    .refine(
      (value) => !value?.trim() || !Number.isNaN(Date.parse(value)),
      "Invalid appointment date"
    ),
})

const patientProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .min(4, "Phone is required"),
  age: z.coerce.number().int().positive("Age must be greater than 0"),
  bloodType: z.enum(BLOOD_TYPES, {
    error: "Please select a blood type",
  }),
  xrayImageBase64: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^data:image\/[a-zA-Z+.-]+;base64,/.test(value),
      "X-ray image is invalid"
    )
    .optional()
    .or(z.literal("")),
})

type ReservationDetailsInput = z.input<typeof reservationDetailsSchema>
type ReservationDetailsValues = z.infer<typeof reservationDetailsSchema>
type PatientProfileFormInputValues = z.input<typeof patientProfileSchema>
type PatientProfileFormValues = z.infer<typeof patientProfileSchema>

const MAX_XRAY_SIZE_BYTES = 2 * 1024 * 1024

export function PatientFormDialog({
  onSubmitReservation,
  isProcessing = false,
}: PatientFormDialogProps) {
  const { t } = useTranslation(["admin", "common"])
  const bookingTypeLabels = useBookingTypeLabels()
  const [open, setOpen] = useState(false)
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [allPatients, setAllPatients] = useState<PatientProfile[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("SY")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [slots, setSlots] = useState<AdminBookableSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [slotError, setSlotError] = useState<string | null>(null)

  const reservationForm = useForm<
    ReservationDetailsInput,
    undefined,
    ReservationDetailsValues
  >({
    resolver: zodResolver(reservationDetailsSchema),
    defaultValues: {
      bookingType: "advance",
      appointmentDate: new Date().toISOString().slice(0, 10),
    },
  })

  const bookingType = reservationForm.watch("bookingType")

  const patientForm = useForm<
    PatientProfileFormInputValues,
    undefined,
    PatientProfileFormValues
  >({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      age: 0,
      bloodType: "A+",
      xrayImageBase64: "",
    },
  })

  useEffect(() => {
    const normalized =
      phoneLocal.trim().length > 0 ? buildE164FromCountryAndLocal(phoneCountry, phoneLocal) : ""
    patientForm.setValue("phone", normalized, { shouldDirty: true, shouldValidate: false })
  }, [patientForm, phoneCountry, phoneLocal])

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase()
    if (!q) return allPatients
    return allPatients.filter((patient) => {
      return (
        patient.name.toLowerCase().includes(q) || patient.phone.toLowerCase().includes(q)
      )
    })
  }, [allPatients, patientSearch])

  const loadPatients = async () => {
    setPatientsLoading(true)
    try {
      const response = await fetch("/api/patients", { credentials: "include" })
      if (!response.ok) {
        const result = (await response.json()) as { message?: string }
        throw new Error(result.message ?? t("patients.loadFailed"))
      }
      const data = (await response.json()) as { data?: PatientProfile[] }
      setAllPatients(data.data ?? [])
    } catch (error) {
      const message = error instanceof Error ? error.message : t("patients.loadFailed")
      toast.error(message)
      setAllPatients([])
    } finally {
      setPatientsLoading(false)
    }
  }

  const loadSlots = async () => {
    setSlotsLoading(true)
    try {
      const response = await fetch("/api/admin/booking-slots?forPicker=1", {
        credentials: "include",
      })
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(result.message ?? t("reservationForm.loadSlotsFailed"))
      }
      const data = (await response.json()) as { slots?: AdminBookableSlot[] }
      setSlots(data.slots ?? [])
    } catch (error) {
      const message = error instanceof Error ? error.message : t("reservationForm.loadSlotsFailed")
      toast.error(message)
      setSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      void loadPatients()
      void loadSlots()
    } else {
      setSelectedSlotId(null)
      setSlotError(null)
      setSlots([])
    }
  }, [open])

  useEffect(() => {
    if (bookingType !== "advance") {
      setSelectedSlotId(null)
      setSlotError(null)
    } else {
      reservationForm.clearErrors("appointmentDate")
    }
  }, [bookingType, reservationForm])

  const handleXrayUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error(t("reservations.imageInvalid"))
      return
    }
    if (file.size > MAX_XRAY_SIZE_BYTES) {
      toast.error(t("reservations.xrayTooLarge"))
      return
    }
    try {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          patientForm.setValue("xrayImageBase64", reader.result, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error(t("reservations.imageProcessFailed"))
    }
  }

  const submit = async (values: ReservationDetailsValues) => {
    setInlineError(null)
    setSlotError(null)

    if (patientMode === "existing" && !selectedPatientId) {
      const message = t("reservationForm.selectPatientFirst")
      setInlineError(message)
      toast.error(message)
      return
    }

    if (patientMode === "new") {
      if (!isValidForCountry(phoneCountry, phoneLocal)) {
        toast.error(t("patients.phoneInvalid"))
        return
      }
      const patientValues = await patientForm.trigger()
      if (!patientValues) {
        return
      }
    }

    if (values.bookingType === "advance") {
      if (!selectedSlotId) {
        const message = t("reservationForm.chooseSlot")
        setSlotError(message)
        toast.error(message)
        return
      }
    } else {
      const d = values.appointmentDate?.trim()
      if (!d || Number.isNaN(Date.parse(d))) {
        reservationForm.setError("appointmentDate", {
          type: "manual",
          message: "Visit date is required for walk-in and emergency",
        })
        toast.error(t("reservationForm.visitDateRequired"))
        return
      }
    }

    const idOrPatient: { patientId: string } | { patient: NonNullable<NewReservationInput["patient"]> } =
      patientMode === "existing"
        ? { patientId: selectedPatientId }
        : {
            patient: {
              name: patientForm.getValues("name"),
              phone: patientForm.getValues("phone"),
              age: Number(patientForm.getValues("age")),
              bloodType: patientForm.getValues("bloodType"),
              xrayImageBase64: patientForm.getValues("xrayImageBase64") || undefined,
            },
          }

    try {
      if (values.bookingType === "advance") {
        await onSubmitReservation({
          ...idOrPatient,
          bookingType: "advance",
          slotId: selectedSlotId!,
        })
      } else {
        await onSubmitReservation({
          ...idOrPatient,
          bookingType: values.bookingType,
          appointmentDate: values.appointmentDate!.trim(),
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("reservationForm.saveFailed")
      setInlineError(message)
      toast.error(message)
      return
    }

    setOpen(false)
    reservationForm.reset({
      bookingType: "advance",
      appointmentDate: new Date().toISOString().slice(0, 10),
    })
    patientForm.reset()
    setPhoneCountry("SY")
    setPhoneLocal("")
    setSelectedPatientId("")
    setPatientSearch("")
    setPatientMode("existing")
    setSelectedSlotId(null)
    setSlotError(null)
  }

  const detailsError = reservationForm.formState.errors
  const patientError = patientForm.formState.errors

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={isProcessing}>{t("reservationForm.addReservation")}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("reservationForm.title")}</DialogTitle>
          <DialogDescription>{t("reservationForm.description")}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={reservationForm.handleSubmit(submit)}>
          <div className="rounded-lg border p-3">
            <p className="mb-2 text-sm font-medium">{t("reservationForm.patient")}</p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setPatientMode("existing")}
                type="button"
                variant={patientMode === "existing" ? "default" : "outline"}
                disabled={isProcessing}
              >
                {t("reservationForm.existing")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => setPatientMode("new")}
                type="button"
                variant={patientMode === "new" ? "default" : "outline"}
                disabled={isProcessing}
              >
                {t("reservationForm.newProfile")}
              </Button>
            </div>
          </div>

          {patientMode === "existing" && (
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="patientSearch">{t("reservationForm.searchPatient")}</Label>
              <Input
                id="patientSearch"
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder={t("reservations.searchPlaceholder")}
                value={patientSearch}
                disabled={isProcessing}
              />
              <Select
                disabled={isProcessing || patientsLoading}
                value={selectedPatientId || "none"}
                onValueChange={(v) => setSelectedPatientId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      patientsLoading ? t("common:actions.loading") : t("reservationForm.selectPatient")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("reservationForm.selectPatient")}</SelectItem>
                  {filteredPatients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} — {patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {patientMode === "new" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">{t("patients.name")}</Label>
                <Input
                  id="name"
                  placeholder={t("reservationForm.fullName")}
                  {...patientForm.register("name")}
                  disabled={isProcessing}
                />
                {patientError.name && (
                  <p className="text-sm text-red-600">{patientError.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("patients.phone")}</Label>
                <PhoneCountryField
                  country={phoneCountry}
                  localNumber={phoneLocal}
                  onCountryChange={setPhoneCountry}
                  onLocalNumberChange={setPhoneLocal}
                  disabled={isProcessing}
                  countryId="new-profile-country"
                  phoneId="phone"
                />
                {patientError.phone && (
                  <p className="text-sm text-red-600">{patientError.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">{t("patients.age")}</Label>
                <Input
                  id="age"
                  min={0}
                  type="number"
                  {...patientForm.register("age")}
                  disabled={isProcessing}
                  onFocus={(e) => e.currentTarget.select()}
                />
                {patientError.age && (
                  <p className="text-sm text-red-600">{patientError.age.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodType">{t("patients.bloodType")}</Label>
                <Controller
                  control={patientForm.control}
                  name="bloodType"
                  render={({ field }) => (
                    <Select
                      disabled={isProcessing}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full" id="bloodType">
                        <SelectValue placeholder={t("patients.bloodType")} />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPES.map((bloodType) => (
                          <SelectItem key={bloodType} value={bloodType}>
                            {bloodType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {patientError.bloodType && (
                  <p className="text-sm text-red-600">{patientError.bloodType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-profile-xray">{t("patients.xrayOptional")}</Label>
                <input
                  id="new-profile-xray"
                  type="file"
                  accept="image/*"
                  className="text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5"
                  disabled={isProcessing}
                  onChange={(event) => void handleXrayUpload(event)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="bookingType">{t("reservations.bookingType")}</Label>
            <Controller
              control={reservationForm.control}
              name="bookingType"
              render={({ field }) => (
                <Select
                  disabled={isProcessing}
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as BookingType)}
                >
                  <SelectTrigger className="w-full" id="bookingType">
                    <SelectValue placeholder={t("bookingTypes.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKING_TYPES.map((bt) => (
                      <SelectItem key={bt} value={bt}>
                        {bookingTypeLabels[bt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {detailsError.bookingType && (
              <p className="text-sm text-red-600">{detailsError.bookingType.message}</p>
            )}
          </div>

          {bookingType === "advance" ? (
            <div className="space-y-2 rounded-lg border border-teal-200/60 bg-teal-50/40 p-3 dark:border-teal-900/40 dark:bg-teal-950/20">
              <Label className="text-slate-900 dark:text-white">{t("reservationForm.timeSlot")}</Label>
              <AdminSlotPicker
                disabled={isProcessing}
                loading={slotsLoading}
                selectedId={selectedSlotId}
                slots={slots}
                onSelect={(id) => {
                  setSelectedSlotId(id)
                  setSlotError(null)
                }}
              />
              {slotError && <p className="text-sm text-red-600">{slotError}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">{t("reservationForm.visitDate")}</Label>
              <p className="text-muted-foreground text-xs">{t("reservationForm.visitDateHint")}</p>
              <Input
                id="appointmentDate"
                type="date"
                {...reservationForm.register("appointmentDate")}
                disabled={isProcessing}
              />
              {detailsError.appointmentDate && (
                <p className="text-sm text-red-600">{detailsError.appointmentDate.message}</p>
              )}
            </div>
          )}

          {inlineError && <p className="text-sm text-red-600">{inlineError}</p>}

          <LoadingButton
            className="w-full"
            type="submit"
            loading={isProcessing}
            loadingText={t("common:actions.loading")}
          >
            {t("reservationForm.saveReservation")}
          </LoadingButton>
        </form>
      </DialogContent>
    </Dialog>
  )
}
