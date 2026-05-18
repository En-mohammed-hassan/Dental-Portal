import {
  marketingContentLocaleSchema,
  marketingContentSchema,
  type MarketingContentInput,
  type MarketingContentLocales,
} from "@/types/public-site"

/** Normalize legacy flat marketing JSON to { en, ar }. */
export function normalizeMarketingContent(raw: unknown): MarketingContentLocales {
  if (raw == null || typeof raw !== "object") {
    return { en: {}, ar: {} }
  }
  const obj = raw as Record<string, unknown>
  if ("en" in obj || "ar" in obj) {
    const parsed = marketingContentSchema.safeParse(raw)
    if (parsed.success) {
      return {
        en: parsed.data.en ?? {},
        ar: parsed.data.ar ?? {},
      }
    }
    return { en: {}, ar: {} }
  }
  const legacy = marketingContentLocaleSchema.safeParse(raw)
  if (legacy.success) {
    return { en: legacy.data, ar: {} }
  }
  return { en: {}, ar: {} }
}

export function parseMarketingForLocale(
  raw: unknown,
  locale: "en" | "ar"
): MarketingContentInput {
  const normalized = normalizeMarketingContent(raw)
  return locale === "ar" ? (normalized.ar ?? {}) : (normalized.en ?? {})
}
