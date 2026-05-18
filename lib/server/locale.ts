import { cookies, headers } from "next/headers"

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  parseLocale,
  type Locale,
} from "@/lib/locale"

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  if (fromCookie) {
    return parseLocale(fromCookie)
  }
  const headerStore = await headers()
  const accept = headerStore.get("accept-language")
  return localeFromAcceptLanguage(accept)
}
