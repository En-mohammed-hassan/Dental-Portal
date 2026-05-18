"use client"

import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBookingTypeLabels } from "@/lib/i18n/use-admin-labels"
import { cn } from "@/lib/utils"
import { type BookingType } from "@/types/patient"

type Value = BookingType | "all"

type BookingTypeFilterSelectProps = {
  value: Value
  onChange: (next: Value) => void
  disabled?: boolean
  className?: string
  id?: string
}

export function BookingTypeFilterSelect({
  value,
  onChange,
  disabled,
  className,
  id,
}: BookingTypeFilterSelectProps) {
  const { t } = useTranslation("admin")
  const bookingTypeLabels = useBookingTypeLabels()

  return (
    <Select
      disabled={disabled}
      value={value}
      onValueChange={(v) => onChange(v as Value)}
    >
      <SelectTrigger className={cn("w-full", className)} id={id}>
        <SelectValue placeholder={t("bookingTypes.placeholder")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("bookingTypes.all")}</SelectItem>
        <SelectItem value="advance">{bookingTypeLabels.advance}</SelectItem>
        <SelectItem value="walk-in">{bookingTypeLabels["walk-in"]}</SelectItem>
        <SelectItem value="emergency">{bookingTypeLabels.emergency}</SelectItem>
      </SelectContent>
    </Select>
  )
}
