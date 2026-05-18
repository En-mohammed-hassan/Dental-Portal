"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AdminLogoutButton } from "@/components/dashboard/admin-logout-button"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AppNavbar() {
  const { t } = useTranslation("admin")
  const { t: tc } = useTranslation("common")
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = useMemo(
    () => [
      { href: "/admin/reservations", label: t("nav.reservations") },
      { href: "/admin/patients", label: t("nav.patients") },
      { href: "/admin/history", label: t("nav.history") },
      { href: "/admin/cms", label: t("nav.cms") },
      { href: "/admin/stats", label: t("nav.stats") },
    ],
    [t]
  )

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-30 border-b bg-white/65 backdrop-blur-xl dark:bg-slate-950/45">
      <div className="mx-auto w-full max-w-7xl px-3 py-2.5 sm:px-4 sm:py-3 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 pe-2">
            <p className="truncate text-[10px] font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400 sm:text-xs">
              {t("suiteBadge")}
            </p>
            <h1 className="hidden truncate text-sm font-semibold sm:block md:text-lg lg:text-xl">
              {t("panelTitle")}
            </h1>
          </div>

          <div className="hidden items-center gap-2 md:flex lg:gap-3">
            <nav className="flex items-center gap-1 rounded-full border bg-white/80 p-1 shadow-sm dark:bg-slate-900/75 sm:gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    className={cn(
                      "rounded-full px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition sm:px-3 sm:py-2 lg:px-4 lg:text-sm",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <Button asChild size="sm" variant="ghost" className="hidden lg:inline-flex">
              <Link href="/">{t("clinicWebsite")}</Link>
            </Button>
            <LanguageSwitcher />
            <AdminLogoutButton />
            <ThemeToggle />
          </div>

          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <LanguageSwitcher className="scale-90 sm:scale-100" />
            <AdminLogoutButton compact />
            <ThemeToggle />
            <button
              className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label={tc("nav.toggleMenu")}
              aria-expanded={mobileMenuOpen}
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="animate-in slide-in-from-top-2 mt-3 flex flex-col gap-1.5 border-t pt-3 pb-2 md:hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  className={cn(
                    "rounded-md px-4 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              href="/"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("clinicWebsite")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
