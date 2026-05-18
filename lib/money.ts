/** Parse major currency units (e.g. 100.50) to integer cents. */
export function majorUnitsToCents(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null
  const n =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).trim().replace(",", "."))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.min(500_000_000, Math.round(n * 100))
}

export function clampCents(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(500_000_000, Math.round(value)))
}
