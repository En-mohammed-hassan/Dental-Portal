"use client"

import { type ChangeEvent, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BLOOD_TYPES,
  type BloodType,
  type OneTimePatientInput,
  type PatientProfile,
} from "@/types/patient"

const MAX_XRAY_SIZE_BYTES = 2 * 1024 * 1024

type Props = {
  open: boolean
  initialName: string
  onOpenChange: (open: boolean) => void
  onCreated: (patient: PatientProfile) => void
  onOneTimeSelected: (patient: OneTimePatientInput) => void
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Failed to read image"))
    reader.onerror = () => reject(new Error("Failed to read image"))
    reader.readAsDataURL(file)
  })
}

export function CreatePatientDialog({
  open,
  initialName,
  onOpenChange,
  onCreated,
  onOneTimeSelected,
}: Props) {
  const { t } = useTranslation(["admin", "common"])
  const [mode, setMode] = useState<"saved" | "one-time">("saved")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")
  const [age, setAge] = useState("")
  const [bloodType, setBloodType] = useState<BloodType | null>(null)
  const [xrayImageBase64, setXrayImageBase64] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initialName)
    setPhone("")
    setDocumentNumber("")
    setAge("")
    setBloodType(null)
    setXrayImageBase64("")
    setError(null)
    setMode("saved")
  }, [initialName, open])

  const handleXrayUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError(t("reservations.imageInvalid"))
      return
    }
    if (file.size > MAX_XRAY_SIZE_BYTES) {
      setError(t("reservations.xrayTooLarge"))
      return
    }
    try {
      setXrayImageBase64(await readFileAsDataUrl(file))
      setError(null)
    } catch {
      setError(t("reservations.imageProcessFailed"))
    }
  }

  const submit = async () => {
    setError(null)
    const normalizedName = name.trim()
    const normalizedPhone = phone.trim()
    const normalizedAge = age.trim() ? Number(age) : null

    if (normalizedName.length < 3) {
      setError(t("scheduler.nameRequired"))
      return
    }
    if (normalizedPhone && !/^0\d{9}$/.test(normalizedPhone)) {
      setError(t("patients.phoneInvalid"))
      return
    }
    if (
      normalizedAge != null &&
      (!Number.isInteger(normalizedAge) || normalizedAge <= 0)
    ) {
      setError(t("scheduler.ageInvalid"))
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          phone: normalizedPhone || null,
          documentNumber: documentNumber.trim() || null,
          age: normalizedAge,
          bloodType,
          xrayImageBase64: xrayImageBase64 || null,
        }),
      })
      const result = (await response.json().catch(() => ({}))) as {
        data?: PatientProfile
        message?: string
      }
      if (!response.ok || !result.data) {
        throw new Error(result.message ?? t("patients.saveFailed"))
      }

      toast.success(t("patients.created"))
      onCreated(result.data)
      onOpenChange(false)
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t("patients.saveFailed")
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const submitOneTime = () => {
    setError(null)
    const normalizedName = name.trim()
    const normalizedPhone = phone.trim()

    if (normalizedName.length < 3) {
      setError(t("scheduler.nameRequired"))
      return
    }
    if (normalizedPhone && !/^0\d{9}$/.test(normalizedPhone)) {
      setError(t("patients.phoneInvalid"))
      return
    }

    onOneTimeSelected({
      name: normalizedName,
      phone: normalizedPhone || null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("patients.addPatientDialog")}</DialogTitle>
          <DialogDescription>{t("reservationForm.addPatientDescription")}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(value as "saved" | "one-time")
            setError(null)
          }}
        >
          <TabsList className="grid h-11 w-full grid-cols-2">
            <TabsTrigger value="saved">{t("reservationForm.addAsNew")}</TabsTrigger>
            <TabsTrigger value="one-time">{t("reservationForm.addOnce")}</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("reservationForm.addAsNewDescription")}
            </p>
            <div className="space-y-1">
              <Label htmlFor="reservation-new-patient-name">{t("patients.name")} *</Label>
              <Input
                id="reservation-new-patient-name"
                value={name}
                maxLength={80}
                disabled={saving}
                autoFocus
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reservation-new-patient-phone">
                {t("patients.phone")} ({t("scheduler.optional")})
              </Label>
              <Input
                id="reservation-new-patient-phone"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="09xxxxxxxx"
                value={phone}
                disabled={saving}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
              <p className="text-xs text-muted-foreground">{t("patients.phoneHint")}</p>
            </div>
            <div className="space-y-1">
            <Label htmlFor="reservation-new-patient-document">
              {t("patients.documentNumber")} ({t("scheduler.optional")})
            </Label>
            <Input
              id="reservation-new-patient-document"
              maxLength={50}
              placeholder={t("patients.documentPlaceholder")}
              value={documentNumber}
              disabled={saving}
              onChange={(event) => setDocumentNumber(event.target.value)}
            />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="reservation-new-patient-age">
                {t("patients.age")} ({t("scheduler.optional")})
              </Label>
              <Input
                id="reservation-new-patient-age"
                type="number"
                min={1}
                inputMode="numeric"
                value={age}
                disabled={saving}
                onChange={(event) => setAge(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>
                {t("patients.bloodType")} ({t("scheduler.optional")})
              </Label>
              <Select
                value={bloodType ?? "none"}
                disabled={saving}
                onValueChange={(value) =>
                  setBloodType(value === "none" ? null : (value as BloodType))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {BLOOD_TYPES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
            <div className="space-y-2">
            <Label htmlFor="reservation-new-patient-xray">{t("patients.xrayOptional")}</Label>
            <input
              id="reservation-new-patient-xray"
              type="file"
              accept="image/*"
              disabled={saving}
              className="w-full text-sm file:me-3 file:rounded-md file:border file:px-3 file:py-1.5"
              onChange={(event) => void handleXrayUpload(event)}
            />
            {xrayImageBase64 ? (
              <div className="flex items-end gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={xrayImageBase64}
                  alt={t("patients.xrayPreview")}
                  className="h-20 w-20 rounded-md border object-cover"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setXrayImageBase64("")}
                >
                  {t("reservations.removeImage")}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("patients.noImage")}</p>
            )}
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <LoadingButton className="w-full" loading={saving} onClick={() => void submit()}>
              {t("patients.addPatientBtn")}
            </LoadingButton>
          </TabsContent>

          <TabsContent value="one-time" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("reservationForm.addOnceDescription")}
            </p>
            <div className="space-y-1">
              <Label htmlFor="reservation-one-time-name">{t("patients.name")} *</Label>
              <Input
                id="reservation-one-time-name"
                value={name}
                maxLength={80}
                disabled={saving}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reservation-one-time-phone">
                {t("patients.phone")} ({t("scheduler.optional")})
              </Label>
              <Input
                id="reservation-one-time-phone"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="09xxxxxxxx"
                value={phone}
                disabled={saving}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
              <p className="text-xs text-muted-foreground">{t("patients.phoneHint")}</p>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button className="w-full" type="button" onClick={submitOneTime}>
              {t("reservationForm.useOnce")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
