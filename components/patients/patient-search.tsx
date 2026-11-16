"use client"

import { Check, ChevronsUpDown, Loader2, Search, UserRound, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { type PatientProfile } from "@/types/patient"

type PatientSearchProps = {
  mode: "filter" | "select"
  patients?: PatientProfile[]
  value?: string
  onValueChange?: (value: string) => void
  selectedPatientId?: string
  onPatientSelect?: (patientId: string) => void
  loading?: boolean
  disabled?: boolean
  className?: string
}

function patientSearchValue(patient: PatientProfile): string {
  return [patient.name, patient.phone, patient.documentNumber, patient.id]
    .filter(Boolean)
    .join(" ")
}

export function PatientSearch({
  mode,
  patients = [],
  value = "",
  onValueChange,
  selectedPatientId = "",
  onPatientSelect,
  loading = false,
  disabled = false,
  className,
}: PatientSearchProps) {
  const { t } = useTranslation("admin")
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  )

  if (mode === "filter") {
    return (
      <div className={cn("relative", className)}>
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          autoComplete="off"
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange?.(event.target.value)}
          placeholder={t("patients.searchPlaceholder")}
          className="ps-9 pe-16"
          aria-label={t("patients.searchPlaceholder")}
        />
        <div className="absolute end-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {value && !disabled && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onValueChange?.("")}
              aria-label={t("patients.clearSearch")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-auto min-h-11 w-full justify-between gap-2 px-3 py-2 text-start font-normal",
            className
          )}
        >
          {selectedPatient ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{selectedPatient.name}</span>
              <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                {[selectedPatient.phone, selectedPatient.documentNumber].filter(Boolean).join(" · ") ||
                  t("patients.noContactDetails")}
              </span>
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <UserRound className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("reservationForm.searchAndSelectPatient")}</span>
            </span>
          )}
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[70] w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t("patients.searchPlaceholder")}
          />
          <CommandList className="max-h-64">
            <CommandEmpty>
              {loading ? t("patients.loading") : t("patients.noPatients")}
            </CommandEmpty>
            <CommandGroup>
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patientSearchValue(patient)}
                  onSelect={() => {
                    onPatientSelect?.(patient.id)
                    setOpen(false)
                    setQuery("")
                  }}
                  className="items-start py-2.5"
                >
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4",
                      patient.id === selectedPatientId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{patient.name}</span>
                    <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                      {[patient.phone, patient.documentNumber].filter(Boolean).join(" · ") ||
                        t("patients.noContactDetails")}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
