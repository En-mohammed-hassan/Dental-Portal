"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { DEFAULT_LOCALE, localeDir, type Locale } from "@/lib/locale"
import { i18nResources } from "@/lib/i18n/resources"
import { I18N_DEFAULT_NS, I18N_NAMESPACES } from "@/lib/i18n/settings"

let initialized = false

export function initI18n(locale: Locale = DEFAULT_LOCALE) {
  if (initialized) {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
    return i18n
  }

  void i18n.use(initReactI18next).init({
    resources: i18nResources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ["en", "ar"],
    ns: [...I18N_NAMESPACES],
    defaultNS: I18N_DEFAULT_NS,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

  initialized = true
  applyDocumentLocale(locale)
  return i18n
}

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === "undefined") return
  const html = document.documentElement
  html.lang = locale
  html.dir = localeDir(locale)
  html.dataset.locale = locale
}

export { i18n }
