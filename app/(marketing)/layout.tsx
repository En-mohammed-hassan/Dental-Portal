import type { Metadata } from "next"

import { AnimateMain } from "@/components/layout/animate-main"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { getPublicSite } from "@/lib/server/public-site"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  try {
    const site = await getPublicSite()
    const title = site.metaTitle?.trim() || site.clinicName?.trim() || "Elkood Dental"
    return {
      title: {
        default: title,
        template: `%s · ${site.clinicName || title}`,
      },
      description: site.metaDescription,
    }
  } catch {
    return {
      title: "Elkood Dental",
      description: "Online booking, patient portal, and staff dashboard.",
    }
  }
}

export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getPublicSite()
  return (
    <MarketingShell site={site}>
      <AnimateMain>{children}</AnimateMain>
    </MarketingShell>
  )
}
