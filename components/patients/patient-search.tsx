"use client"

import { Check, Loader2, Plus, Search, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { type PatientProfile } from "@/types/patient"

type PatientSearchProps = {
  mode: "filter" | "select"
  patients?: PatientProfile[]
  value?: string
  onValueChange?: (value: string) => void
  selectedPatientId?: string
  onPatientSelect?: (patientId: string) => void
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  onCreatePatient?: (name: string) => void
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
  searchValue,
  onSearchValueChange,
  onCreatePatient,
  loading = false,
  disabled = false,
  className,
}: PatientSearchProps) {
  const { t } = useTranslation("admin")
  const [open, setOpen] = useState(false)
  const [internalQuery, setInternalQuery] = useState("")
  const query = searchValue ?? internalQuery
  const setQuery = (next: string) => {
    setInternalQuery(next)
    onSearchValueChange?.(next)
  }
  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  )
  const trimmedQuery = query.trim()
  const canCreatePatient =
    Boolean(onCreatePatient) &&
    !loading &&
    !selectedPatient &&
    trimmedQuery.length >= 3 &&
    !patients.some(
      (patient) => patient.name.trim().toLocaleLowerCase() === trimmedQuery.toLocaleLowerCase()
    )

  if (mode === "filter") {
    return (
      <div className={cn("relative w-full", className)}>
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
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative w-full", className)}>
          <Search className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls="patient-search-results"
            autoComplete="off"
            disabled={disabled}
            value={selectedPatient ? selectedPatient.name : query}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onChange={(event) => {
              if (selectedPatientId) onPatientSelect?.("")
              setQuery(event.target.value)
              setOpen(true)
            }}
            placeholder={t("reservationForm.searchAndSelectPatient")}
            className="h-11 ps-9 pe-11"
          />
          <div className="absolute end-2 top-1/2 z-10 flex -translate-y-1/2 items-center">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : selectedPatient ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPatientSelect?.("")
                  setQuery("")
                  setOpen(true)
                }}
                aria-label={t("patients.clearSearch")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : canCreatePatient ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-primary hover:text-primary"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setOpen(false)
                  onCreatePatient?.(trimmedQuery)
                }}
                aria-label={t("reservationForm.addTypedPatient", { name: trimmedQuery })}
                title={t("reservationForm.addTypedPatient", { name: trimmedQuery })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        collisionPadding={16}
        sideOffset={6}
        className="z-[70] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false} className="min-h-0">
          <CommandList
            id="patient-search-results"
            className="min-h-0 overscroll-contain touch-pan-y"
            style={{
              maxHeight:
                "min(18rem, 40dvh, var(--radix-popover-content-available-height))",
              WebkitOverflowScrolling: "touch",
            }}
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            <CommandEmpty>
              {loading ? t("patients.loading") : t("patients.noPatients")}
            </CommandEmpty>
            <CommandGroup>
              {canCreatePatient && (
                <CommandItem
                  value={`create-${trimmedQuery}`}
                  onSelect={() => {
                    setOpen(false)
                    onCreatePatient?.(trimmedQuery)
                  }}
                  className="min-h-11 border-b py-2.5 text-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span className="truncate font-medium">
                    {t("reservationForm.addTypedPatient", { name: trimmedQuery })}
                  </span>
                </CommandItem>
              )}
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patientSearchValue(patient)}
                  onSelect={() => {
                    onPatientSelect?.(patient.id)
                    setQuery(patient.name)
                    setOpen(false)
                  }}
                  className="min-h-11 items-start py-2.5"
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
