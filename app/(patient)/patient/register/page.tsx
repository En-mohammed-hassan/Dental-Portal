"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { type CountryCode } from "libphonenumber-js"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { PhoneCountryField } from "@/components/ui/phone-country-field"
import { LoadingButton } from "@/components/ui/loading-button"
import { buildE164FromCountryAndLocal, isValidForCountry } from "@/lib/phone"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BLOOD_TYPES } from "@/types/patient"

const MAX_XRAY_SIZE_BYTES = 2 * 1024 * 1024

export default function PatientRegisterPage() {
  const { t } = useTranslation("patient")
  const router = useRouter()
  const [name, setName] = useState("")
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("SY")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [age, setAge] = useState("")
  const [bloodType, setBloodType] = useState<string>(BLOOD_TYPES[0])
  const [xrayImageBase64, setXrayImageBase64] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (!isValidForCountry(phoneCountry, phoneLocal)) {
        throw new Error(t("phoneInvalid"))
      }
      const phone = buildE164FromCountryAndLocal(phoneCountry, phoneLocal)
      const res = await fetch("/api/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          age: Number(age),
          bloodType,
          xrayImageBase64: xrayImageBase64 || "",
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        throw new Error(data.message ?? t("registerFailed"))
      }
      toast.success(t("registerSuccess"))
      router.push("/sign-in?mode=patient")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failed"))
    } finally {
      setLoading(false)
    }
  }

  const handleXrayUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error(t("imageInvalid"))
      return
    }
    if (file.size > MAX_XRAY_SIZE_BYTES) {
      toast.error(t("xrayTooLarge"))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setXrayImageBase64(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-lg dark:border-slate-800 dark:bg-slate-900/90">
      <CardHeader>
        <CardTitle>{t("registerCardTitle")}</CardTitle>
        <CardDescription>{t("registerCardDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          <div className="space-y-2">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("phoneLabel")}</Label>
            <PhoneCountryField
              country={phoneCountry}
              localNumber={phoneLocal}
              onCountryChange={setPhoneCountry}
              onLocalNumberChange={setPhoneLocal}
              disabled={loading}
              countryId="phone-country"
              phoneId="phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">{t("ageLabel")}</Label>
            <Input
              id="age"
              type="number"
              min={1}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t("bloodTypeLabel")}</Label>
            <Select value={bloodType} onValueChange={setBloodType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_TYPES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="xrayImageBase64">{t("xrayLabel")}</Label>
            <input
              id="xrayImageBase64"
              type="file"
              accept="image/*"
              className="text-sm file:me-3 file:rounded-md file:border file:px-3 file:py-1.5"
              onChange={(e) => void handleXrayUpload(e)}
            />
            {xrayImageBase64 ? (
              <p className="text-muted-foreground text-xs">{t("xrayAttached")}</p>
            ) : null}
          </div>
          <LoadingButton
            className="w-full"
            loading={loading}
            loadingText={t("saving")}
            type="submit"
          >
            {t("continue")}
          </LoadingButton>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          {t("alreadyRegistered")}{" "}
          <Link
            className="font-medium text-teal-700 underline dark:text-teal-400"
            href="/sign-in?mode=patient"
          >
            {t("signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
