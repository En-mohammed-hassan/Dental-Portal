import type { Locale } from "@/lib/locale"
import type { I18nNamespace } from "@/lib/i18n/settings"

import enAdmin from "@/locales/en/admin.json"
import enAuth from "@/locales/en/auth.json"
import enCommon from "@/locales/en/common.json"
import enMarketing from "@/locales/en/marketing.json"
import enPatient from "@/locales/en/patient.json"

import arAdmin from "@/locales/ar/admin.json"
import arAuth from "@/locales/ar/auth.json"
import arCommon from "@/locales/ar/common.json"
import arMarketing from "@/locales/ar/marketing.json"
import arPatient from "@/locales/ar/patient.json"

const enResources: Record<I18nNamespace, Record<string, unknown>> = {
  common: enCommon,
  marketing: enMarketing,
  auth: enAuth,
  patient: enPatient,
  admin: enAdmin,
}

const arResources: Record<I18nNamespace, Record<string, unknown>> = {
  common: arCommon,
  marketing: arMarketing,
  auth: arAuth,
  patient: arPatient,
  admin: arAdmin,
}

export const i18nResources: Record<Locale, Record<I18nNamespace, Record<string, unknown>>> = {
  en: enResources,
  ar: arResources,
}
