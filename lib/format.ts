import { intlLocale, type Locale } from "@/lib/locale"

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(date)
}

export function formatDateTime(
  value: Date | string | number,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(date)
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value)
}

/** Format integer cents as currency in major units (2 decimal places). */
export function formatMoneyFromCents(cents: number, locale: Locale): string {
  const major = cents / 100
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major)
}
