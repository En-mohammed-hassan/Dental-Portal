import { z } from "zod"

/** Max serialized payload (~9MB file as base64) to limit abuse. */
const MAX_IMAGE_CHARS = 12_000_000

export function isStoredImageValue(s: string): boolean {
  const t = s.trim()
  if (!t) {
    return false
  }
  if (/^data:image\/[a-zA-Z0-9+.-]+;base64,/.test(t)) {
    return true
  }
  if (/^https?:\/\//i.test(t)) {
    return true
  }
  return false
}

/**
 * Optional image field for JSON bodies (Zod 4–safe).
 * Accepts: omitted, null, "", data URL, or https URL.
 */
export const optionalStoredImageSchema = z
  .union([
    z.null(),
    z.literal(""),
    z
      .string()
      .max(MAX_IMAGE_CHARS)
      .refine((s) => isStoredImageValue(s), {
        message: "Image must be a data URL (data:image/…;base64,…) or https URL",
      }),
  ])
  .optional()

export const requiredStoredImageSchema = z
  .string()
  .min(1)
  .max(MAX_IMAGE_CHARS)
  .refine(isStoredImageValue, {
    message: "Image must be a data URL or https URL",
  })
