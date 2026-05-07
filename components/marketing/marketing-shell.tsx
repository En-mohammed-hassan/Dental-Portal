"use client"

import { MarketingFooter } from "@/components/marketing/marketing-footer"
import { MarketingHeader } from "@/components/marketing/marketing-header"
import { SiteContentProvider } from "@/components/marketing/site-content-context"
import { type PublicSite } from "@/types/public-site"

export function MarketingShell({
  site,
  children,
}: {
  site: PublicSite
  children: React.ReactNode
}) {
  return (
    <SiteContentProvider value={site}>
      <div className="relative flex min-h-screen flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f1f5f9_100%)] dark:bg-[linear-gradient(180deg,#0b1020_0%,#111827_50%,#0f172a_100%)]">
        <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-size-[48px_48px] opacity-50" />
        <MarketingHeader />
        <main className="relative z-10 flex w-full flex-1 flex-col">{children}</main>
        <MarketingFooter />
      </div>
    </SiteContentProvider>
  )
}
