"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import { type ChangeEvent, useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LinkedReservationsDialog } from "@/components/patients/linked-reservations-dialog"
import { BLOOD_TYPES, type PatientProfile } from "@/types/patient"

const PAGE_SIZE = 6
const MAX_XRAY_SIZE_BYTES = 2 * 1024 * 1024

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

type PatientProfileFormInputValues = z.input<typeof patientProfileSchema>
type PatientProfileFormValues = z.infer<typeof patientProfileSchema>

const readFileAsDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }
      reject(new Error("Failed to read image"))
    }
    reader.onerror = () => reject(new Error("Failed to read image"))
    reader.readAsDataURL(file)
  })
}

// Helper function to reset form state
const resetFormState = () => ({
  name: "",
  phone: "",
  age: 0,
  bloodType: "A+" as const,
  xrayImageBase64: "",
})

export function PatientManagement() {
  // State management
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create")
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewXrayImage, setPreviewXrayImage] = useState<string | null>(null)
  const [previewXrayTitle, setPreviewXrayTitle] = useState<string>("")
  const [reservationsPatient, setReservationsPatient] = useState<PatientProfile | null>(null)

  const form = useForm<
    PatientProfileFormInputValues,
    undefined,
    PatientProfileFormValues
  >({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: resetFormState(),
  })

  const loadPatients = async () => {
    setIsLoadingPatients(true)
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(search)}`)
      const data = (await response.json()) as { data?: PatientProfile[] }
      setPatients(data.data ?? [])
    } finally {
      setIsLoadingPatients(false)
    }
  }

  useEffect(() => {
    void loadPatients()
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(patients.length / PAGE_SIZE))
  const paginatedPatients = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return patients.slice(start, start + PAGE_SIZE)
  }, [patients, page])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const submit = async (values: PatientProfileFormValues) => {
    setErrorMessage(null)
    setIsSubmitting(true)
    const endpoint =
      editorMode === "edit" && selectedPatient
        ? `/api/patients/${selectedPatient.id}`
        : "/api/patients"
    const method = editorMode === "edit" ? "PATCH" : "POST"

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    const result = (await response.json()) as { message?: string }
    if (!response.ok) {
      setErrorMessage(result.message ?? "Failed to save patient")
      setIsSubmitting(false)
      return
    }

    form.reset(resetFormState())
    setSelectedPatient(null)
    setEditorOpen(false)
    await loadPatients()
    setIsSubmitting(false)
  }

  const handleXrayUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose a valid image file")
      return
    }

    if (file.size > MAX_XRAY_SIZE_BYTES) {
      setErrorMessage("X-ray image must be 2MB or smaller")
      return
    }

    try {
      const base64Data = await readFileAsDataUrl(file)
      form.setValue("xrayImageBase64", base64Data, {
        shouldDirty: true,
        shouldValidate: true,
      })
    } catch {
      setErrorMessage("Failed to process image")
    }
  }

  const removePatient = async () => {
    if (!deletePatientId) return
    setErrorMessage(null)
    setIsDeleting(true)
    const response = await fetch(`/api/patients/${deletePatientId}`, { method: "DELETE" })
    const result = (await response.json()) as { message?: string }

    if (!response.ok) {
      setErrorMessage(result.message ?? "Failed to delete patient")
      setIsDeleting(false)
      return
    }

    setDeletePatientId(null)
    await loadPatients()
    setIsDeleting(false)
  }

  const openCreate = () => {
    setEditorMode("create")
    setSelectedPatient(null)
    setErrorMessage(null)
    form.reset(resetFormState())
    setEditorOpen(true)
  }

  const openEdit = (patient: PatientProfile) => {
    setEditorMode("edit")
    setSelectedPatient(patient)
    setErrorMessage(null)
    form.reset({
      name: patient.name,
      phone: patient.phone,
      age: patient.age,
      bloodType: patient.bloodType,
      xrayImageBase64: patient.xrayImageBase64 ?? "",
    })
    setEditorOpen(true)
  }

  const openXrayPreview = (image: string, patientName: string) => {
    setPreviewXrayImage(image)
    setPreviewXrayTitle(`${patientName} X-ray`)
  }

  const openPatientReservations = (patient: PatientProfile) => {
    setReservationsPatient(patient)
  }

  const xrayPreview = form.watch("xrayImageBase64")
  const formError = form.formState.errors

  return (
    <>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card className="backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Patient Directory</CardTitle>
              <Button disabled={isSubmitting || isDeleting} onClick={openCreate} type="button">
                Add Patient
              </Button>
            </div>
            <Input
              disabled={isLoadingPatients || isSubmitting || isDeleting}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or phone"
              value={search}
            />
          </CardHeader>
          <CardContent className="space-y-2">
            {patients.length === 0 && !isLoadingPatients && (
              <p className="text-muted-foreground text-sm">No patients found.</p>
            )}
            {isLoadingPatients && (
              <p className="text-muted-foreground text-sm">Loading patients...</p>
            )}
            <AnimatePresence mode="popLayout">
              {paginatedPatients.map((patient, index) => (
                <motion.div
                  className="bg-background/80 hover:border-primary/40 flex cursor-pointer flex-col gap-3 rounded-md border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between"
                  key={patient.id}
                  onClick={() => openPatientReservations(patient)}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                <div className="flex items-center gap-3">
                  {patient.xrayImageBase64 ? (
                    <button
                      className="cursor-zoom-in flex-shrink-0"
                      onClick={(event) => {
                        event.stopPropagation()
                        openXrayPreview(patient.xrayImageBase64 ?? "", patient.name)
                      }}
                      type="button"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={`${patient.name} xray`}
                        className="h-12 w-12 rounded-md border object-cover"
                        src={patient.xrayImageBase64}
                      />
                    </button>
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border text-[10px]">
                      No X-ray
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{patient.name}</p>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      <span className="break-all">{patient.phone}</span> • {patient.age} years •{" "}
                      {patient.bloodType}
                    </p>
                  </div>
                </div>
                <div
                  className="flex gap-2 sm:flex-shrink-0"
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button
                    disabled={isSubmitting || isDeleting}
                    onClick={(event) => {
                      event.stopPropagation()
                      openEdit(patient)
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Edit
                  </Button>
                  <Button
                    disabled={isSubmitting || isDeleting}
                    onClick={(event) => {
                      event.stopPropagation()
                      setDeletePatientId(patient.id)
                    }}
                    size="sm"
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </div>
              </motion.div>
              ))}
            </AnimatePresence>
            {patients.length > PAGE_SIZE && (
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-muted-foreground text-xs">
                  Page {page} / {totalPages}
                </span>
                <Button
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) {
            setSelectedPatient(null)
            setErrorMessage(null)
            form.reset(resetFormState())
          }
        }}
        open={editorOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editorMode === "edit" ? "Edit Patient" : "Add Patient"}</DialogTitle>
            <DialogDescription>
              Maintain your master patient profile list for reservation usage.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={form.handleSubmit(submit)}>
            <div className="space-y-1">
              <Label htmlFor="patient-name">Name</Label>
              <Input disabled={isSubmitting} id="patient-name" {...form.register("name")} />
              {formError.name && <p className="text-sm text-red-600">{formError.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="patient-phone">Phone</Label>
              <Input
                disabled={isSubmitting}
                id="patient-phone"
                placeholder="0993198176"
                {...form.register("phone")}
              />
              {formError.phone && (
                <p className="text-sm text-red-600">{formError.phone.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="patient-age">Age</Label>
              <Input
                disabled={isSubmitting}
                id="patient-age"
                min={1}
                type="number"
                {...form.register("age")}
              />
              {formError.age && <p className="text-sm text-red-600">{formError.age.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="patient-blood">Blood Type</Label>
              <select
                className="ui-select"
                disabled={isSubmitting}
                id="patient-blood"
                {...form.register("bloodType")}
              >
                {BLOOD_TYPES.map((bloodType) => (
                  <option key={bloodType} value={bloodType}>
                    {bloodType}
                  </option>
                ))}
              </select>
              {formError.bloodType && (
                <p className="text-sm text-red-600">{formError.bloodType.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-xray">X-ray Image (optional)</Label>
              <input
                accept="image/*"
                className="text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5"
                disabled={isSubmitting}
                id="patient-xray"
                onChange={(event) => void handleXrayUpload(event)}
                type="file"
              />
              {xrayPreview ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="X-ray preview"
                    className="h-24 w-24 rounded-md border object-cover"
                    src={xrayPreview}
                  />
                  <Button
                    onClick={() =>
                      form.setValue("xrayImageBase64", "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No image uploaded</p>
              )}
              {formError.xrayImageBase64 && (
                <p className="text-sm text-red-600">{formError.xrayImageBase64.message}</p>
              )}
            </div>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Saving..."
                : editorMode === "edit"
                  ? "Update Patient"
                  : "Add Patient"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setPreviewXrayImage(null)
            setPreviewXrayTitle("")
          }
        }}
        open={Boolean(previewXrayImage)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{previewXrayTitle || "Patient X-ray"}</DialogTitle>
            <DialogDescription>Click outside to close preview.</DialogDescription>
          </DialogHeader>
          {previewXrayImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={previewXrayTitle || "X-ray preview"}
              className="max-h-[70vh] w-full rounded-lg border object-contain"
              src={previewXrayImage}
            />
          )}
        </DialogContent>
      </Dialog>

      <LinkedReservationsDialog
        onOpenChange={(open) => {
          if (!open) {
            setReservationsPatient(null)
          }
        }}
        open={Boolean(reservationsPatient)}
        patient={reservationsPatient}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setDeletePatientId(null)
        }}
        open={Boolean(deletePatientId)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You can only delete patients that do not
              have reservations linked to them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="disabled:pointer-events-none disabled:opacity-50"
              disabled={isDeleting}
              onClick={() => void removePatient()}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
