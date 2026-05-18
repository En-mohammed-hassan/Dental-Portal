"use client"

import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { applyDocumentLocale } from "@/lib/i18n/client"
import { parseLocale } from "@/lib/locale"

export function LocaleDocument() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const locale = parseLocale(i18n.language)
    applyDocumentLocale(locale)
    document.body.classList.toggle("font-arabic", locale === "ar")
  }, [i18n.language])

  return null
}
