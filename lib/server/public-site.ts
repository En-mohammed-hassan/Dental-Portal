import { Prisma } from "@prisma/client"

import { ensureSiteSettings } from "@/lib/server/site-settings"
import { prisma } from "@/lib/server/db"
import {
  marketingContentSchema,
  type PublicSite,
} from "@/types/public-site"

const DEFAULT_FEATURES: PublicSite["homeFeatures"] = [
  { title: "Sterile & safe", description: "Strict hygiene protocols." },
  { title: "Easy booking", description: "Pick open slots online." },
  { title: "Modern care", description: "Clear treatment notes & follow-up." },
]

function parseMarketingJson(raw: unknown) {
  if (raw == null || typeof raw !== "object") {
    return marketingContentSchema.parse({})
  }
  const parsed = marketingContentSchema.safeParse(raw)
  return parsed.success ? parsed.data : marketingContentSchema.parse({})
}

export function mergePublicSite(row: {
  clinicName: string
  heroTitle: string
  heroSubtitle: string
  heroImageBase64: string | null
  aboutMarkdown: string | null
  contactPhone: string | null
  contactEmail: string | null
  address: string | null
  footerNote: string | null
  marketingContent: Prisma.JsonValue | null
}): PublicSite {
  const m = parseMarketingJson(row.marketingContent)

  const navBadge = m.nav?.badge?.trim() || "Clinic"
  const navTitle = m.nav?.title?.trim() || row.clinicName
  const footerLegalLine =
    m.footer?.legalLine?.trim() ||
    "Professional dental care. Edit this line in Admin → Website → Branding & pages."
  const metaTitle = m.meta?.title?.trim() || row.clinicName
  const metaDescription =
    m.meta?.description?.trim() || row.heroSubtitle || "Book visits and manage care online."

  const bookPageTitle = m.pages?.book?.title?.trim() || "Book an appointment"
  const bookPageSubtitle =
    m.pages?.book?.subtitle?.trim() ||
    "Choose a date on the calendar, then select a time. Staff publish availability in the admin panel."

  const servicesPageTitle = m.pages?.services?.title?.trim() || "Services"
  const servicesPageSubtitle =
    m.pages?.services?.subtitle?.trim() ||
    "Treatments your team publishes from the admin panel appear here automatically."
  const servicesEmptyMessage =
    m.pages?.services?.empty?.trim() ||
    "No services yet. Add them under Staff → Website & slots → Services."

  const galleryPageTitle = m.pages?.gallery?.title?.trim() || "Gallery"
  const galleryPageSubtitle =
    m.pages?.gallery?.subtitle?.trim() ||
    "Before & after moments and clinic life — curated by your team."
  const galleryEmptyMessage =
    m.pages?.gallery?.empty?.trim() ||
    "No photos yet. Add images from the admin panel → Website & slots → Gallery."

  const blogPageTitle = m.pages?.blog?.title?.trim() || "Blog"
  const blogPageSubtitle =
    m.pages?.blog?.subtitle?.trim() ||
    "Oral health tips and clinic updates — edited by your team."
  const blogEmptyMessage =
    m.pages?.blog?.empty?.trim() || "No published posts yet. Add posts from the admin panel."

  const customFeatures = m.home?.features?.filter(
    (f) => f.title.trim().length > 0 || f.description.trim().length > 0
  )
  const homeFeatures =
    customFeatures && customFeatures.length > 0 ? customFeatures : DEFAULT_FEATURES

  const homeImageCaptionTitle =
    m.home?.imageCaption?.title?.trim() || "Your clinic, your story"
  const homeImageCaptionSubtitle =
    m.home?.imageCaption?.subtitle?.trim() ||
    "Staff edit copy, services, and gallery from one place."

  const homeCtaPrimary = m.home?.ctas?.primary?.trim() || "Book a visit"
  const homeCtaSecondary = m.home?.ctas?.secondary?.trim() || "Explore services"

  const homeHeroEmptyHint =
    m.home?.heroEmptyHint?.trim() ||
    "Set a hero image from the admin panel — or enjoy this soft gradient for now."

  return {
    clinicName: row.clinicName,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    heroImageBase64: row.heroImageBase64,
    aboutMarkdown: row.aboutMarkdown,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    address: row.address,
    footerNote: row.footerNote,
    navBadge,
    navTitle,
    footerLegalLine,
    metaTitle,
    metaDescription,
    bookPageTitle,
    bookPageSubtitle,
    servicesPageTitle,
    servicesPageSubtitle,
    servicesEmptyMessage,
    galleryPageTitle,
    galleryPageSubtitle,
    galleryEmptyMessage,
    blogPageTitle,
    blogPageSubtitle,
    blogEmptyMessage,
    homeFeatures,
    homeImageCaptionTitle,
    homeImageCaptionSubtitle,
    homeCtaPrimary,
    homeCtaSecondary,
    homeHeroEmptyHint,
  }
}

export async function getPublicSite(): Promise<PublicSite> {
  await ensureSiteSettings()
  const row = await prisma.siteSettings.findUniqueOrThrow({
    where: { id: "default" },
  })
  return mergePublicSite(row)
}
