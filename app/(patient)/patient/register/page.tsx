"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { type CountryCode } from "libphonenumber-js"
import toast from "react-hot-toast"

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
        throw new Error("Phone number is not valid for selected country.")
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
        throw new Error(data.message ?? "Registration failed")
      }
      toast.success("Profile created — sign in with your phone")
      router.push("/sign-in?mode=patient")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  const handleXrayUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file")
      return
    }
    if (file.size > MAX_XRAY_SIZE_BYTES) {
      toast.error("X-ray image must be 2MB or smaller")
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
        <CardTitle>Create your profile</CardTitle>
        <CardDescription>
          Use the same details the clinic would put on file. You&apos;ll verify with a code sent to
          your phone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
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
            <Label htmlFor="age">Age</Label>
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
            <Label>Blood type</Label>
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
            <Label htmlFor="xrayImageBase64">X-ray image (optional)</Label>
            <input
              id="xrayImageBase64"
              type="file"
              accept="image/*"
              className="text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5"
              onChange={(e) => void handleXrayUpload(e)}
            />
            {xrayImageBase64 ? (
              <p className="text-muted-foreground text-xs">Image attached successfully.</p>
            ) : null}
          </div>
          <LoadingButton className="w-full" loading={loading} loadingText="Saving…" type="submit">
            Continue
          </LoadingButton>
        </form>
        <p className="mt-6 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link className="font-medium text-teal-700 underline dark:text-teal-400" href="/sign-in?mode=patient">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
