"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/reservations", label: "Reservations" },
  { href: "/patients", label: "Patient Management" },
  { href: "/history", label: "History" },
]

export function AppNavbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
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
          <div className="flex-shrink-0 min-w-0">
            <p className="text-[10px] font-medium tracking-wider text-slate-500 uppercase dark:text-slate-400 sm:text-xs truncate">
              Dentist Suite
            </p>
            <h1 className="text-sm font-semibold sm:text-base md:text-lg lg:text-xl truncate">
              Clinic Control Panel
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 md:flex lg:gap-3">
            <nav className="flex items-center gap-1 rounded-full border bg-white/80 p-1 shadow-sm dark:bg-slate-900/75 sm:gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    className={cn(
                      "rounded-full px-2.5 py-1.5 text-xs font-medium transition whitespace-nowrap sm:px-3 sm:py-2 lg:px-4 lg:text-sm",
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
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle />
            <button
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle menu"
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

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="mt-3 flex flex-col gap-1.5 border-t pt-3 pb-2 md:hidden animate-in slide-in-from-top-2">
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
          </nav>
        )}
      </div>
    </header>
  )
}
