"use client"

import { useMemo, useState } from "react"
import { LayoutGrid, View } from "lucide-react"

import { fdiToArchAlias, fdiToothLabel, FDI_CHAINS } from "@/lib/dental/fdi-teeth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type TeethTreatedPickerProps = {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  id?: string
  readOnly?: boolean
  title?: string
  description?: string
  triggerLabel?: string
}

function ToothShape({ selected }: { selected: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "h-9 w-8 drop-shadow-[0_1px_1px_rgba(2,6,23,0.15)] transition-all",
        selected ? "text-teal-500" : "text-slate-300 dark:text-slate-600"
      )}
      viewBox="0 0 64 72"
      fill="none"
    >
      <path
        d="M18 7C10 10 6 17 7 27c1 9 4 15 8 20 3 4 4 7 5 11 1 4 2 7 6 7 4 0 5-4 6-8 1-5 2-8 5-8s4 3 5 8c1 4 2 8 6 8s5-3 6-7c1-4 2-7 5-11 4-5 7-11 8-20 1-10-3-17-11-20-7-3-12-2-19 2-7-4-12-5-19-2Z"
        fill="currentColor"
      />
      <path
        d="M32 19v13"
        stroke="rgba(255,255,255,0.65)"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M23 20c2 1 5 2 9 2s7-1 9-2"
        stroke="rgba(255,255,255,0.55)"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function ChainRow({
  label,
  codes,
  selected,
  onToggle,
  disabled,
  readOnly,
}: {
  label: string
  codes: readonly string[]
  selected: Set<string>
  onToggle: (code: string) => void
  disabled?: boolean
  readOnly: boolean
}) {
  return (
    <section className="space-y-2">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{label}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 lg:grid-cols-16">
        {codes.map((code) => {
          const active = selected.has(code)
          return (
            <button
              key={code}
              type="button"
              disabled={disabled || readOnly}
              onClick={() => onToggle(code)}
              title={fdiToothLabel(code)}
              className={cn(
                "group relative rounded-xl border p-2 transition-all",
                "focus-visible:ring-primary/35 focus-visible:outline-none focus-visible:ring-2",
                active
                  ? "border-teal-500 bg-teal-100/90 shadow-sm dark:border-teal-400 dark:bg-teal-900/35"
                  : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/70 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-700 dark:hover:bg-teal-950/20",
                readOnly && "cursor-default"
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <ToothShape selected={active} />
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums",
                    active ? "text-teal-900 dark:text-teal-100" : "text-slate-700 dark:text-slate-200"
                  )}
                >
                  {fdiToArchAlias(code)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{code}</span>
              </div>
              {active ? (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-600 dark:bg-teal-400" />
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function TeethTreatedPicker({
  value,
  onChange,
  disabled,
  id,
  readOnly = false,
  title = "Mouth Teeth Chart",
  description = "Select treated teeth using full-mouth chain view with aliases (UR/UL/LR/LL).",
  triggerLabel,
}: TeethTreatedPickerProps) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => new Set(value), [value])

  const summary =
    value.length === 0
      ? readOnly
        ? "No teeth recorded"
        : "No teeth selected"
      : `${value.length} selected · ${value.join(", ")}`

  function toggle(code: string) {
    if (readOnly) return
    const next = new Set(selected)
    if (next.has(code)) {
      next.delete(code)
    } else {
      next.add(code)
    }
    onChange([...next].sort((a, b) => Number(a) - Number(b)))
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Teeth treated (FDI)</Label>
      <Button
        id={id}
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="h-auto min-h-10 w-full justify-between px-3 py-2 font-normal"
      >
        <span className="truncate text-left text-sm">{triggerLabel ?? summary}</span>
        <View className="ml-2 size-4 shrink-0 opacity-70" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutGrid className="size-4" />
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="rounded-lg border border-dashed border-slate-300/70 bg-white/60 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
              Naming standard: alias + FDI code. Example: <strong>UL7 (27)</strong>,{" "}
              <strong>UR6 (16)</strong>, <strong>LL7 (37)</strong>.
            </div>
            <ChainRow
              label="Upper Arch (Right -> Left)"
              codes={FDI_CHAINS.upper}
              selected={selected}
              onToggle={toggle}
              disabled={disabled}
              readOnly={readOnly}
            />
            <ChainRow
              label="Lower Arch (Right -> Left)"
              codes={FDI_CHAINS.lower}
              selected={selected}
              onToggle={toggle}
              disabled={disabled}
              readOnly={readOnly}
            />
          </div>

          <DialogFooter className="sm:justify-between">
            <p className="text-muted-foreground text-xs">{summary}</p>
            <div className="flex items-center gap-2">
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onChange([])}
                  disabled={disabled || value.length === 0}
                >
                  Clear
                </Button>
              ) : null}
              <Button type="button" onClick={() => setOpen(false)}>
                {readOnly ? "Close" : "Done"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
