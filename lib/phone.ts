import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js"

const DEFAULT_COUNTRY: CountryCode = "SY"

export function dialCodeForCountry(country: CountryCode): string {
  return `+${getCountryCallingCode(country)}`
}

export function normalizeToE164(input: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  const raw = input.trim()
  if (!raw) return null
  const parsed = parsePhoneNumberFromString(raw, raw.startsWith("+") ? undefined : country)
  if (!parsed || !parsed.isValid()) return null
  return parsed.number
}

export function buildProfilePhoneCandidates(
  input: string,
  country: CountryCode = DEFAULT_COUNTRY
): string[] {
  const normalized = normalizeToE164(input, country)
  if (!normalized) return []

  const digits = normalized.replace(/[^\d]/g, "")
  const out = new Set<string>([normalized, digits])

  // Backward compatibility with old Syrian local storage style (09xxxxxxxx)
  if (digits.startsWith("963") && digits.length === 12) {
    out.add(`0${digits.slice(3)}`)
  }

  return [...out]
}

export function fixedOtpFromPhone(input: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  const normalized = normalizeToE164(input, country)
  if (!normalized) return null
  const digits = normalized.replace(/[^\d]/g, "")
  if (digits.length < 6) return null
  return digits.slice(-6)
}

export function buildE164FromCountryAndLocal(country: CountryCode, localNumber: string): string {
  const digits = localNumber.replace(/[^\d]/g, "")
  return `+${getCountryCallingCode(country)}${digits.replace(/^0+/, "")}`
}

export function isValidForCountry(country: CountryCode, localNumber: string): boolean {
  const e164 = buildE164FromCountryAndLocal(country, localNumber)
  return isValidPhoneNumber(e164)
}

export function splitPhoneToCountryAndLocal(
  value: string,
  fallbackCountry: CountryCode = DEFAULT_COUNTRY
): { country: CountryCode; localNumber: string } {
  const parsed = parsePhoneNumberFromString(
    value,
    value.trim().startsWith("+") ? undefined : fallbackCountry
  )
  if (parsed?.country) {
    return {
      country: parsed.country as CountryCode,
      localNumber: parsed.nationalNumber,
    }
  }
  const cleaned = value.replace(/[^\d]/g, "")
  return { country: fallbackCountry, localNumber: cleaned }
}

export const COUNTRY_OPTIONS: Array<{ country: CountryCode; dial: string; label: string }> = (() => {
  const names = new Intl.DisplayNames(["en"], { type: "region" })
  return getCountries().map((country) => {
    const dial = `+${getCountryCallingCode(country)}`
    const name = names.of(country) ?? country
    return { country, dial, label: `${name} (${dial})` }
  })
})()

