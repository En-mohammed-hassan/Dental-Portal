import { z } from "zod"

/** Raw JSON from DB — partial overrides only; server merges with defaults. */
export const marketingContentSchema = z.object({
  nav: z
    .object({
      badge: z.string().max(80).optional(),
      title: z.string().max(120).optional(),
    })
    .optional(),
  footer: z
    .object({
      legalLine: z.string().max(300).optional(),
    })
    .optional(),
  meta: z
    .object({
      title: z.string().max(120).optional(),
      description: z.string().max(320).optional(),
    })
    .optional(),
  pages: z
    .object({
      book: z
        .object({
          title: z.string().max(200).optional(),
          subtitle: z.string().max(500).optional(),
        })
        .optional(),
      services: z
        .object({
          title: z.string().max(200).optional(),
          subtitle: z.string().max(500).optional(),
          empty: z.string().max(500).optional(),
        })
        .optional(),
      gallery: z
        .object({
          title: z.string().max(200).optional(),
          subtitle: z.string().max(500).optional(),
          empty: z.string().max(500).optional(),
        })
        .optional(),
      blog: z
        .object({
          title: z.string().max(200).optional(),
          subtitle: z.string().max(500).optional(),
          empty: z.string().max(500).optional(),
        })
        .optional(),
    })
    .optional(),
  home: z
    .object({
      features: z
        .array(
          z.object({
            title: z.string().max(100),
            description: z.string().max(240),
          })
        )
        .max(6)
        .optional(),
      imageCaption: z
        .object({
          title: z.string().max(120).optional(),
          subtitle: z.string().max(240).optional(),
        })
        .optional(),
      ctas: z
        .object({
          primary: z.string().max(80).optional(),
          secondary: z.string().max(80).optional(),
        })
        .optional(),
      heroEmptyHint: z.string().max(400).optional(),
    })
    .optional(),
})

export type MarketingContentInput = z.infer<typeof marketingContentSchema>

/** Fully merged public payload for layout + client context. */
export type PublicSite = {
  clinicName: string
  heroTitle: string
  heroSubtitle: string
  heroImageBase64: string | null
  aboutMarkdown: string | null
  contactPhone: string | null
  contactEmail: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  address: string | null
  footerNote: string | null
  navBadge: string
  navTitle: string
  footerLegalLine: string
  metaTitle: string
  metaDescription: string
  bookPageTitle: string
  bookPageSubtitle: string
  servicesPageTitle: string
  servicesPageSubtitle: string
  servicesEmptyMessage: string
  galleryPageTitle: string
  galleryPageSubtitle: string
  galleryEmptyMessage: string
  blogPageTitle: string
  blogPageSubtitle: string
  blogEmptyMessage: string
  homeFeatures: Array<{ title: string; description: string }>
  homeImageCaptionTitle: string
  homeImageCaptionSubtitle: string
  homeCtaPrimary: string
  homeCtaSecondary: string
  homeHeroEmptyHint: string
}
