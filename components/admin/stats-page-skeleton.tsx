"use client"

import { useTranslation } from "react-i18next"

export function StatsPageSkeleton() {
  const { t } = useTranslation("admin")

  return (
    <div className="flex min-h-[60vh] w-full min-w-0 max-w-full flex-col items-center justify-center gap-6 overflow-x-hidden py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm font-medium text-muted-foreground">{t("stats.pageLoading")}</p>
      <div className="grid w-full max-w-4xl gap-4 px-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`sk-${i}`}
            className="h-28 animate-pulse rounded-xl border bg-white/60 dark:bg-slate-900/50"
          />
        ))}
      </div>
      <div className="grid h-64 w-full max-w-4xl animate-pulse gap-4 rounded-xl border bg-white/40 lg:grid-cols-2 dark:bg-slate-900/30" />
    </div>
  )
}
