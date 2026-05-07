"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { type BookingType } from "@/types/patient"
import { bookingTypeLabels } from "@/utils/patient"

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
  return (
    <Select
      disabled={disabled}
      value={value}
      onValueChange={(v) => onChange(v as Value)}
    >
      <SelectTrigger className={cn("w-full", className)} id={id}>
        <SelectValue placeholder="Booking type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All booking types</SelectItem>
        <SelectItem value="advance">{bookingTypeLabels.advance}</SelectItem>
        <SelectItem value="walk-in">{bookingTypeLabels["walk-in"]}</SelectItem>
        <SelectItem value="emergency">{bookingTypeLabels.emergency}</SelectItem>
      </SelectContent>
    </Select>
  )
}
