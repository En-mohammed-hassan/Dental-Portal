"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { BookingCalendar, type BookingSlot } from "@/components/booking/booking-calendar"
import { useSiteContent } from "@/components/marketing/site-content-context"
import { Button } from "@/components/ui/button"

type Me = {
  user: {
    role: string
    kind: string
    phone: string
  } | null
}

export default function BookPage() {
  const { t } = useTranslation("marketing")
  const site = useSiteContent()
  const [slots, setSlots] = useState<BookingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<string | null>(null)
  const [me, setMe] = useState<Me["user"]>(null)
  const [meLoading, setMeLoading] = useState(true)

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d: Me) => setMe(d.user))
      .finally(() => setMeLoading(false))
  }, [])

  const loadSlots = useCallback(() => {
    setLoading(true)
    void fetch("/api/public/slots", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(await r.text().catch(() => r.statusText))
        }
        return r.json() as Promise<{ slots?: BookingSlot[] }>
      })
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => {
        toast.error(t("book.loadSlotsError"))
        setSlots([])
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  const isPatient = me?.kind === "patient" || me?.role === "PATIENT"
  const isStaff = me?.kind === "staff"

  async function book(slotId: string) {
    if (!isPatient) {
      toast.error(t("book.signInToBook"))
      return
    }
    setBooking(slotId)
    try {
      const res = await fetch("/api/patient/reservations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string }
      if (!res.ok) {
        if (res.status === 401) {
          toast.error(t("book.sessionExpired"))
          return
        }
        throw new Error(data.message ?? t("book.bookingFailed"))
      }
      toast.success(t("book.bookingSuccess"))
      void loadSlots()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("book.bookingFailed"))
    } finally {
      setBooking(null)
    }
  }

  const authBanner = !meLoading ? (
    isStaff ? (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        <span>{t("book.staffSignedIn")}</span>
        <Button asChild size="sm" variant="secondary" className="rounded-full">
          <Link href="/admin/reservations">{t("book.openDashboard")}</Link>
        </Button>
      </div>
    ) : isPatient ? (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-teal-200/80 bg-teal-50/90 px-4 py-3 text-sm text-teal-950 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>{t("book.patientSignedIn", { phone: me?.phone ?? "" })}</span>
        <Button
          asChild
          size="sm"
          className="rounded-full border-2 border-teal-800 bg-white font-semibold text-teal-950 shadow-sm hover:bg-teal-50 dark:border-teal-400 dark:bg-slate-950 dark:text-teal-50 dark:hover:bg-teal-950/40"
        >
          <Link href="/patient">{t("book.myVisits")}</Link>
        </Button>
      </div>
    ) : (
      <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-sm text-slate-700 dark:text-slate-300">{t("book.registerPrompt")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" className="rounded-full">
            <Link href="/patient/register">{t("book.register")}</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/sign-in?mode=patient">{t("book.patientSignIn")}</Link>
          </Button>
        </div>
      </div>
    )
  ) : null

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:max-w-[1100px] lg:px-8 lg:py-14">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {site.bookPageTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {site.bookPageSubtitle}
        </p>
      </div>

      <BookingCalendar
        slots={slots}
        loading={loading}
        isPatient={Boolean(isPatient)}
        isStaff={Boolean(isStaff)}
        bookingId={booking}
        onBook={book}
        authBanner={authBanner}
      />
    </div>
  )
}
