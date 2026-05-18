"use client"

import { useTranslation } from "react-i18next"

import { isRtl, localeDir, parseLocale, type Locale } from "@/lib/locale"

export function useUiDirection() {
  const { i18n } = useTranslation()
  const locale = parseLocale(i18n.language)
  const dir = localeDir(locale)
  return {
    locale,
    dir,
    isRtl: isRtl(locale),
  } satisfies { locale: Locale; dir: "ltr" | "rtl"; isRtl: boolean }
}

export function cmsContentDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}
