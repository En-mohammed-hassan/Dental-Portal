import type { Metadata } from "next"

import { AnimateMain } from "@/components/layout/animate-main"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { getPublicSite } from "@/lib/server/public-site"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const site = await getPublicSite()
  return {
    title: {
      default: site.metaTitle,
      template: `%s · ${site.clinicName}`,
    },
    description: site.metaDescription,
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
