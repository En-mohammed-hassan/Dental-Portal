"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js"
import toast from "react-hot-toast"
import { ShieldCheck, Sparkles } from "lucide-react"

import { FadeIn } from "@/components/motion/motion-shell"
import { LoadingButton } from "@/components/ui/loading-button"
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

const countryDisplay = new Intl.DisplayNames(["en"], { type: "region" })
const countryOptions = getCountries().map((country) => {
  const dial = `+${getCountryCallingCode(country)}`
  const name = countryDisplay.of(country) ?? country
  return { country, dial, label: `${name} (${dial})` }
})

type LoginKind = "admin" | "patient"

export function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get("next") ?? ""

  const [patientCountry, setPatientCountry] = useState<CountryCode>("SY")
  const [localNumber, setLocalNumber] = useState("")
  const [normalizedPhone, setNormalizedPhone] = useState("")
  const [phoneKey, setPhoneKey] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"phone" | "code">("phone")
  const [loading, setLoading] = useState(false)

  const displayPhone = useMemo(() => {
    if (!normalizedPhone) return ""
    return parsePhoneNumberFromString(normalizedPhone)?.formatInternational() ?? normalizedPhone
  }, [normalizedPhone])

  const afterLogin = useCallback(
    (kind: LoginKind) => {
      if (kind === "admin") {
        const target = nextParam.startsWith("/admin") ? nextParam : "/admin/reservations"
        router.push(target)
      } else {
        const target = nextParam.startsWith("/patient") ? nextParam : "/patient"
        router.push(target)
      }
      router.refresh()
    },
    [nextParam, router]
  )

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const digits = localNumber.replace(/[^\d]/g, "")
      if (digits.length < 6) {
        throw new Error("Please enter a valid phone number.")
      }
      const candidate = `+${getCountryCallingCode(patientCountry)}${digits.replace(/^0+/, "")}`
      if (!isValidPhoneNumber(candidate)) {
        throw new Error("Phone number is not valid for selected country.")
      }

      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: candidate, country: patientCountry }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        delivery?: "in_app" | "sms"
        phoneKey?: string
        loginType?: LoginKind
        fallbackReason?: "country_not_eligible"
      }
      if (!res.ok) {
        throw new Error(data.message ?? "Could not send OTP")
      }
      setNormalizedPhone(candidate)
      setPhoneKey(data.phoneKey ?? candidate)
      setStep("code")
      toast.success("OTP requested. Call admin to get your code.")
      if (data.fallbackReason === "country_not_eligible") {
        toast("SMS is not eligible in this country, switched to secure in-app fallback.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneKey || normalizedPhone, code }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        message?: string
        user?: { kind?: LoginKind }
      }
      if (!res.ok) {
        throw new Error(data.message ?? "Invalid code")
      }
      const kind = data.user?.kind ?? "patient"
      toast.success(`Signed in as ${kind}`)
      afterLogin(kind)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-teal-100/80 via-white to-fuchsia-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-size-[40px_40px]" />
      <FadeIn className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400"
          >
            <Sparkles className="h-4 w-4" />
            Back to website
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Sign in with OTP
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            One login flow for everyone. We auto-detect admin vs patient after OTP verification.
          </p>
        </div>

        <Card className="border-slate-200/80 bg-white/90 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              Secure OTP Login
            </CardTitle>
            <CardDescription>
              Admin numbers are protected in database seed. Others log in as patients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "phone" ? (
              <form className="space-y-4" onSubmit={(e) => void sendOtp(e)}>
                <div className="space-y-2">
                  <Label htmlFor="country-code">Country code</Label>
                  <Select
                    value={patientCountry}
                    onValueChange={(v) => setPatientCountry(v as CountryCode)}
                    disabled={loading}
                  >
                    <SelectTrigger id="country-code" className="w-full">
                      <SelectValue placeholder="Country code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((c) => (
                        <SelectItem key={c.country} value={c.country}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-local">Phone number</Label>
                  <Input
                    id="phone-local"
                    autoComplete="tel-national"
                    inputMode="tel"
                    placeholder="Local number (e.g. 09xxxxxxxx)"
                    value={localNumber}
                    onChange={(e) => setLocalNumber(e.target.value.replace(/[^\d]/g, ""))}
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Number is validated with global standards before sending OTP.
                  </p>
                </div>

                <LoadingButton
                  className="h-11 w-full rounded-xl text-base"
                  loading={loading}
                  loadingText="Requesting OTP…"
                  type="submit"
                >
                  Send verification code
                </LoadingButton>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(e) => void verifyOtp(e)}>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter the 6-digit OTP for <span className="font-medium">{displayPhone}</span>.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.3em]"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>

                <LoadingButton
                  className="h-11 w-full rounded-xl text-base"
                  loading={loading}
                  loadingText="Verifying…"
                  type="submit"
                >
                  Verify & sign in
                </LoadingButton>
                <LoadingButton
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={loading}
                  onClick={() => {
                    setStep("phone")
                    setCode("")
                    setPhoneKey("")
                  }}
                >
                  Use a different number
                </LoadingButton>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
              New patient?{" "}
              <Link
                className="font-medium text-teal-700 underline underline-offset-4 dark:text-teal-400"
                href="/patient/register"
              >
                Register first
              </Link>
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}

