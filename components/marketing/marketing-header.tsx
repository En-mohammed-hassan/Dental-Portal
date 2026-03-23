"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { useSiteContent } from "@/components/marketing/site-content-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/gallery", label: "Gallery" },
  { href: "/book", label: "Book" },
]

const patientLink = { href: "/patient", label: "My visits" }

type Me = {
  user: {
    role: string
    kind: string
    phone: string
  } | null
}

export function MarketingHeader() {
  const site = useSiteContent()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [me, setMe] = useState<Me["user"]>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    void fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json() as Promise<Me>)
      .then((d) => setMe(d.user))
      .catch(() => setMe(null))
  }, [])

  const isPatient = me?.kind === "patient" || me?.role === "PATIENT"
  const isStaff = me?.kind === "staff"
  const navLinks = isPatient ? [...links, patientLink] : links

  const linkActive = (href: string) => {
    if (href === "/patient") {
      return pathname === "/patient"
    }
    if (href === "/") {
      return pathname === "/"
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  async function signOutPatient() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      setMe(null)
      router.push("/sign-in?mode=patient")
      router.refresh()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-white/75 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link className="flex flex-col leading-tight" href="/">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-teal-600 uppercase dark:text-teal-400">
            {site.navBadge}
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            {site.navTitle}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-200",
                linkActive(l.href)
                  ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isPatient ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={signingOut}
              className="hidden rounded-full border-slate-300 sm:inline-flex dark:border-slate-600"
              onClick={() => void signOutPatient()}
            >
              {signingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing out…
                </>
              ) : (
                "Sign out"
              )}
            </Button>
          ) : isStaff ? (
            <Button asChild size="sm" variant="outline" className="hidden rounded-full sm:inline-flex">
              <Link href="/admin/reservations">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="hidden rounded-full sm:inline-flex">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
          <ThemeToggle />
          <button
            type="button"
            className="rounded-md p-2 md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800">
          <div className="flex flex-col gap-2">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  linkActive(l.href)
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-700 dark:text-slate-200"
                )}
              >
                {l.label}
              </Link>
            ))}
            {isPatient ? (
              <button
                type="button"
                disabled={signingOut}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 disabled:opacity-50 dark:text-slate-200"
                onClick={() => void signOutPatient()}
              >
                {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            ) : isStaff ? (
              <Link href="/admin/reservations" className="rounded-lg px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
            ) : (
              <Link href="/sign-in" className="rounded-lg px-3 py-2 text-sm font-medium">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
