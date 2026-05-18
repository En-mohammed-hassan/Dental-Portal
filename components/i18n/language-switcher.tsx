"use client"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/locale"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation("common")
  const current = (i18n.language === "ar" ? "ar" : "en") as Locale

  function setLocale(locale: Locale) {
    void i18n.changeLanguage(locale)
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border bg-white/80 p-0.5 text-xs shadow-sm dark:bg-slate-900/75",
        className
      )}
      role="group"
      aria-label={t("language.label")}
    >
      <Button
        type="button"
        size="sm"
        variant={current === "en" ? "default" : "ghost"}
        className="h-7 rounded-full px-2.5 text-xs"
        onClick={() => setLocale("en")}
      >
        EN
      </Button>
      <Button
        type="button"
        size="sm"
        variant={current === "ar" ? "default" : "ghost"}
        className="h-7 rounded-full px-2.5 text-xs font-medium"
        onClick={() => setLocale("ar")}
      >
        عربي
      </Button>
    </div>
  )
}
