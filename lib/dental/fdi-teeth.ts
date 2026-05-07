/**
 * Permanent teeth in FDI notation (quadrant 1–4 × tooth 1–8).
 * @see https://en.wikipedia.org/wiki/FDI_World_Dental_Federation_notation
 */
const QUADRANT_LABELS: Record<number, string> = {
  1: "Upper right",
  2: "Upper left",
  3: "Lower left",
  4: "Lower right",
}

const TOOTH_NAMES: Record<number, string> = {
  1: "Central incisor",
  2: "Lateral incisor",
  3: "Canine",
  4: "1st premolar",
  5: "2nd premolar",
  6: "1st molar",
  7: "2nd molar",
  8: "3rd molar",
}

export const FDI_PERMANENT_CODES: string[] = (() => {
  const out: string[] = []
  for (let q = 1; q <= 4; q++) {
    for (let t = 1; t <= 8; t++) {
      out.push(`${q}${t}`)
    }
  }
  return out
})()

const codeSet = new Set(FDI_PERMANENT_CODES)

export function isValidFdiToothCode(code: string): boolean {
  return codeSet.has(code)
}

export function normalizeTeethTreated(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const unique = [...new Set(raw.map((x) => String(x).trim()).filter(isValidFdiToothCode))]
  unique.sort((a, b) => Number(a) - Number(b))
  return unique.length ? unique : null
}

export function fdiToothLabel(code: string): string {
  if (!isValidFdiToothCode(code)) return code
  const q = Number(code[0])
  const t = Number(code[1])
  const quad = QUADRANT_LABELS[q] ?? `Q${q}`
  const name = TOOTH_NAMES[t] ?? `Tooth ${t}`
  return `${code} · ${fdiToArchAlias(code)} · ${quad} · ${name}`
}

export function fdiToArchAlias(code: string): string {
  if (!isValidFdiToothCode(code)) return code
  const q = Number(code[0])
  const t = Number(code[1])
  const side = q === 1 || q === 4 ? "R" : "L"
  const arch = q === 1 || q === 2 ? "U" : "L"
  return `${arch}${side}${t}`
}

export const FDI_CHAINS = {
  upper: ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"],
  lower: ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"],
} as const

export const FDI_BY_QUADRANT: { quadrant: number; label: string; codes: string[] }[] = [1, 2, 3, 4].map(
  (quadrant) => ({
    quadrant,
    label: QUADRANT_LABELS[quadrant] ?? `Q${quadrant}`,
    codes: Array.from({ length: 8 }, (_, i) => `${quadrant}${i + 1}`),
  })
)
