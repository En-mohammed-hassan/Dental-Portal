"use client"

import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"

import { useSiteContent } from "@/components/marketing/site-content-context"
import { cn } from "@/lib/utils"

export function MarketingFooter() {
  const site = useSiteContent()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-white/80 py-12 backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-teal-600 uppercase dark:text-teal-400">
                {site.navBadge}
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {site.clinicName}
              </p>
            </div>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {site.contactPhone ? (
                <a
                  href={`tel:${site.contactPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 transition hover:text-teal-700 dark:hover:text-teal-400"
                >
                  <Phone className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                  {site.contactPhone}
                </a>
              ) : null}
              {site.contactEmail ? (
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="flex items-center gap-2 transition hover:text-teal-700 dark:hover:text-teal-400"
                >
                  <Mail className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                  {site.contactEmail}
                </a>
              ) : null}
              {site.address ? (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                  <span>{site.address}</span>
                </p>
              ) : null}
            </div>
            {site.footerNote ? (
              <p className="max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-500">
                {site.footerNote}
              </p>
            ) : null}
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Quick links
            </p>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              {[
                { href: "/services", label: "Services" },
                { href: "/blog", label: "Blog" },
                { href: "/gallery", label: "Gallery" },
                { href: "/book", label: "Book" },
                { href: "/sign-in?mode=patient", label: "Patient sign in" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-slate-600 transition hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div
          className={cn(
            "mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-8 sm:flex-row dark:border-slate-800/80"
          )}
        >
          <p className="text-center text-[11px] text-slate-500 dark:text-slate-500 sm:text-left">
            © {year} {site.clinicName}
          </p>
          <p className="max-w-xl text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500 sm:text-right">
            {site.footerLegalLine}
          </p>
        </div>
      </div>
    </footer>
  )
}
