"use client"

import { type CountryCode } from "libphonenumber-js"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { COUNTRY_OPTIONS } from "@/lib/phone"

type PhoneCountryFieldProps = {
  country: CountryCode
  localNumber: string
  onCountryChange: (country: CountryCode) => void
  onLocalNumberChange: (local: string) => void
  disabled?: boolean
  countryId?: string
  phoneId?: string
}

export function PhoneCountryField({
  country,
  localNumber,
  onCountryChange,
  onLocalNumberChange,
  disabled,
  countryId,
  phoneId,
}: PhoneCountryFieldProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,220px)_1fr]">
      <Select
        value={country}
        onValueChange={(v) => onCountryChange(v as CountryCode)}
        disabled={disabled}
      >
        <SelectTrigger id={countryId} className="w-full">
          <SelectValue placeholder="Country code" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_OPTIONS.map((c) => (
            <SelectItem key={c.country} value={c.country}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        id={phoneId}
        autoComplete="tel-national"
        inputMode="tel"
        placeholder="Local number (e.g. 09xxxxxxxx)"
        value={localNumber}
        onChange={(e) => onLocalNumberChange(e.target.value.replace(/[^\d]/g, ""))}
        disabled={disabled}
        required
      />
    </div>
  )
}

