"use client"

import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"

import { applyDocumentLocale, initI18n, i18n } from "@/lib/i18n/client"
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  parseLocale,
  type Locale,
} from "@/lib/locale"

function readInitialLocale(): Locale {
  if (typeof document !== "undefined") {
    const fromHtml = document.documentElement.dataset.locale
    if (fromHtml) return parseLocale(fromHtml)
    const fromCookie = Cookies.get(LOCALE_COOKIE)
    if (fromCookie) return parseLocale(fromCookie)
    if (typeof navigator !== "undefined") {
      const lang = navigator.language.toLowerCase()
      if (lang.startsWith("ar")) return "ar"
    }
  }
  return DEFAULT_LOCALE
}

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>(
    () => initialLocale ?? readInitialLocale()
  )

  initI18n(locale)

  useEffect(() => {
    initI18n(locale)
  }, [locale])

  useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      const next = parseLocale(lng)
      setLocale(next)
      applyDocumentLocale(next)
      Cookies.set(LOCALE_COOKIE, next, { expires: 365, sameSite: "lax", path: "/" })
      router.refresh()
    }
    i18n.on("languageChanged", onLanguageChanged)
    return () => {
      i18n.off("languageChanged", onLanguageChanged)
    }
  }, [router])

  useEffect(() => {
    applyDocumentLocale(locale)
  }, [locale])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export function useSetLocale() {
  return (locale: Locale) => {
    void i18n.changeLanguage(locale)
  }
}
