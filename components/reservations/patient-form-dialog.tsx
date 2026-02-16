"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useMemo, useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
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
import {
  BLOOD_TYPES,
  BOOKING_TYPES,
  type NewReservationInput,
  type PatientProfile,
} from "@/types/patient"
import { bookingTypeLabels } from "@/utils/patient"

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
    .min(1, "Appointment date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid appointment date"),
})

const patientProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Phone must be exactly 10 digits (e.g. 0993198176)"),
  age: z.coerce.number().int().positive("Age must be greater than 0"),
  bloodType: z.enum(BLOOD_TYPES, {
    error: "Please select a blood type",
  }),
})

type ReservationDetailsInput = z.input<typeof reservationDetailsSchema>
type ReservationDetailsValues = z.infer<typeof reservationDetailsSchema>
type PatientProfileFormInputValues = z.input<typeof patientProfileSchema>
type PatientProfileFormValues = z.infer<typeof patientProfileSchema>

export function PatientFormDialog({
  onSubmitReservation,
  isProcessing = false,
}: PatientFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing")
  const [selectedPatientId, setSelectedPatientId] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [allPatients, setAllPatients] = useState<PatientProfile[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

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
    },
  })

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
      const response = await fetch("/api/patients")
      const data = (await response.json()) as { data?: PatientProfile[] }
      setAllPatients(data.data ?? [])
    } finally {
      setPatientsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      void loadPatients()
    }
  }, [open])

  const submit = async (values: ReservationDetailsValues) => {
    setInlineError(null)
    try {
      if (patientMode === "existing") {
        if (!selectedPatientId) {
          setInlineError("Please select a patient first.")
          return
        }
        await onSubmitReservation({
          patientId: selectedPatientId,
          bookingType: values.bookingType,
          appointmentDate: values.appointmentDate,
        })
      } else {
        const patientValues = await patientForm.trigger()
        if (!patientValues) {
          return
        }

        const parsedPatient = patientForm.getValues()
        await onSubmitReservation({
          patient: {
            name: parsedPatient.name,
            phone: parsedPatient.phone,
            age: Number(parsedPatient.age),
            bloodType: parsedPatient.bloodType,
          },
          bookingType: values.bookingType,
          appointmentDate: values.appointmentDate,
        })
      }
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Failed to save reservation")
      return
    }
    setOpen(false)
    reservationForm.reset()
    patientForm.reset()
    setSelectedPatientId("")
    setPatientSearch("")
    setPatientMode("existing")
  }

  const detailsError = reservationForm.formState.errors
  const patientError = patientForm.formState.errors

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button disabled={isProcessing}>Add Reservation</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>New Reservation</DialogTitle>
          <DialogDescription>
            Add a patient reservation with proper validation.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={reservationForm.handleSubmit(submit)}>
          <div className="rounded-lg border p-3">
            <p className="mb-2 text-sm font-medium">Patient Source</p>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => setPatientMode("existing")}
                type="button"
                variant={patientMode === "existing" ? "default" : "outline"}
                disabled={isProcessing}
              >
                Select Existing
              </Button>
              <Button
                className="flex-1"
                onClick={() => setPatientMode("new")}
                type="button"
                variant={patientMode === "new" ? "default" : "outline"}
                disabled={isProcessing}
              >
                Create New Patient
              </Button>
            </div>
          </div>

          {patientMode === "existing" && (
            <div className="space-y-2 rounded-lg border p-3">
              <Label htmlFor="patientSearch">Search Patient</Label>
              <Input
                id="patientSearch"
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Search by name or phone"
                value={patientSearch}
                disabled={isProcessing}
              />
              <select
                className="ui-select"
                onChange={(event) => setSelectedPatientId(event.target.value)}
                value={selectedPatientId}
                disabled={isProcessing}
              >
                <option value="">
                  {patientsLoading ? "Loading patients..." : "Select a patient"}
                </option>
                {filteredPatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {patientMode === "new" && (
            <>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Patient full name"
              {...patientForm.register("name")}
              disabled={isProcessing}
            />
            {patientError.name && (
              <p className="text-sm text-red-600">{patientError.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="0993198176"
              {...patientForm.register("phone")}
              disabled={isProcessing}
            />
            {patientError.phone && (
              <p className="text-sm text-red-600">{patientError.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              min={1}
              type="number"
              {...patientForm.register("age")}
              disabled={isProcessing}
            />
            {patientError.age && (
              <p className="text-sm text-red-600">{patientError.age.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloodType">Blood Type</Label>
            <select
              id="bloodType"
              className="ui-select"
              {...patientForm.register("bloodType")}
              disabled={isProcessing}
            >
              {BLOOD_TYPES.map((bloodType) => (
                <option key={bloodType} value={bloodType}>
                  {bloodType}
                </option>
              ))}
            </select>
            {patientError.bloodType && (
              <p className="text-sm text-red-600">{patientError.bloodType.message}</p>
            )}
          </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="bookingType">Booking Type</Label>
            <select
              id="bookingType"
              className="ui-select"
              {...reservationForm.register("bookingType")}
              disabled={isProcessing}
            >
              {BOOKING_TYPES.map((bookingType) => (
                <option key={bookingType} value={bookingType}>
                  {bookingTypeLabels[bookingType]}
                </option>
              ))}
            </select>
            {detailsError.bookingType && (
              <p className="text-sm text-red-600">{detailsError.bookingType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointmentDate">Appointment Date</Label>
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
          {inlineError && <p className="text-sm text-red-600">{inlineError}</p>}

          <Button className="w-full" type="submit" disabled={isProcessing}>
            {isProcessing ? "Saving..." : "Save Reservation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
