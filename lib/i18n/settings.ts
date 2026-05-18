import type { Locale } from "@/lib/locale"

export const I18N_NAMESPACES = [
  "common",
  "marketing",
  "auth",
  "patient",
  "admin",
] as const

export type I18nNamespace = (typeof I18N_NAMESPACES)[number]

export const I18N_DEFAULT_NS: I18nNamespace = "common"

export function i18nLanguage(locale: Locale): string {
  return locale
}
