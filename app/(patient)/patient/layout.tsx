import { AnimateMain } from "@/components/layout/animate-main"
import { MarketingShell } from "@/components/marketing/marketing-shell"
import { getPublicSite } from "@/lib/server/public-site"

export const dynamic = "force-dynamic"

export default async function PatientShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const site = await getPublicSite()
  return (
    <MarketingShell site={site}>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <AnimateMain>{children}</AnimateMain>
      </div>
    </MarketingShell>
  )
}
