export const LOCALE_COOKIE = "elkood_locale"

export type Locale = "en" | "ar"

export const DEFAULT_LOCALE: Locale = "ar"

export const SUPPORTED_LOCALES: Locale[] = ["en", "ar"]

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ar"
}

export function parseLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar"
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return isRtl(locale) ? "rtl" : "ltr"
}

export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-SA" : "en-US"
}

/** Pick localized string with English fallback. */
export function pickLocalized(
  locale: Locale,
  en: string | null | undefined,
  ar: string | null | undefined
): string {
  const primary = locale === "ar" ? ar?.trim() : en?.trim()
  if (primary) return primary
  return en?.trim() || ar?.trim() || ""
}

export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE
  const parts = header.split(",").map((p) => p.trim().split(";")[0]?.toLowerCase())
  for (const part of parts) {
    if (part?.startsWith("ar")) return "ar"
    if (part?.startsWith("en")) return "en"
  }
  return DEFAULT_LOCALE
}
