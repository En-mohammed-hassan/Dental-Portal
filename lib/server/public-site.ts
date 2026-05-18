import { Prisma } from "@prisma/client"

import { parseMarketingForLocale } from "@/lib/marketing-content"
import { pickLocalized, type Locale } from "@/lib/locale"
import { ensureSiteSettings } from "@/lib/server/site-settings"
import { getServerLocale } from "@/lib/server/locale"
import { prisma } from "@/lib/server/db"
import type { PublicSite } from "@/types/public-site"

const DEFAULT_FEATURES_EN: PublicSite["homeFeatures"] = [
  { title: "Sterile & safe", description: "Strict hygiene protocols." },
  { title: "Easy booking", description: "Pick open slots online." },
  { title: "Modern care", description: "Clear treatment notes & follow-up." },
]

const DEFAULT_FEATURES_AR: PublicSite["homeFeatures"] = [
  { title: "تعقيم وأمان", description: "بروتوكولات نظافة صارمة." },
  { title: "حجز سهل", description: "اختر المواعيد المتاحة عبر الإنترنت." },
  { title: "رعاية حديثة", description: "ملاحظات علاجية واضحة ومتابعة." },
]

type SiteRow = {
  clinicName: string
  clinicNameAr: string | null
  heroTitle: string
  heroTitleAr: string | null
  heroSubtitle: string
  heroSubtitleAr: string | null
  heroImageBase64: string | null
  aboutMarkdown: string | null
  aboutMarkdownAr: string | null
  contactPhone: string | null
  contactEmail: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  address: string | null
  addressAr: string | null
  footerNote: string | null
  footerNoteAr: string | null
  marketingContent: Prisma.JsonValue | null
}

export function mergePublicSite(row: SiteRow, locale: Locale): PublicSite {
  const m = parseMarketingForLocale(row.marketingContent, locale)
  const clinicName = pickLocalized(locale, row.clinicName, row.clinicNameAr)
  const heroTitle = pickLocalized(locale, row.heroTitle, row.heroTitleAr)
  const heroSubtitle = pickLocalized(locale, row.heroSubtitle, row.heroSubtitleAr)

  const defaults =
    locale === "ar"
      ? {
          navBadge: "عيادة",
          footerLegal:
            "رعاية أسنان احترافية. عدّل هذا السطر من لوحة التحكم → الموقع → الهوية والصفحات.",
          metaDescription: "احجز الزيارات وأدر رعايتك عبر الإنترنت.",
          bookTitle: "حجز موعد",
          bookSubtitle:
            "اختر تاريخاً من التقويم، ثم اختر الوقت. يحدد الموظفون المواعيد المتاحة من لوحة التحكم.",
          servicesTitle: "الخدمات",
          servicesSubtitle:
            "العلاجات التي ينشرها فريقك من لوحة التحكم تظهر هنا تلقائياً.",
          servicesEmpty: "لا توجد خدمات بعد. أضفها من لوحة التحكم → الموقع → الخدمات.",
          galleryTitle: "المعرض",
          gallerySubtitle: "لحظات قبل وبعد وحياة العيادة — يختارها فريقك.",
          galleryEmpty: "لا توجد صور بعد. أضفها من لوحة التحكم → الموقع → المعرض.",
          blogTitle: "المدونة",
          blogSubtitle: "نصائح صحة الفم وتحديثات العيادة — يحررها فريقك.",
          blogEmpty: "لا توجد مقالات منشورة بعد. أضفها من لوحة التحكم.",
          captionTitle: "عيادتك، قصتك",
          captionSubtitle: "يحرر الموظفون النصوص والخدمات والمعرض من مكان واحد.",
          ctaPrimary: "احجز زيارة",
          ctaSecondary: "استكشف الخدمات",
          heroEmpty:
            "أضف صورة البطل من لوحة التحكم — أو استمتع بهذا التدرج الناعم.",
        }
      : {
          navBadge: "Clinic",
          footerLegal:
            "Professional dental care. Edit this line in Admin → Website → Branding & pages.",
          metaDescription: "Book visits and manage care online.",
          bookTitle: "Book an appointment",
          bookSubtitle:
            "Choose a date on the calendar, then select a time. Staff publish availability in the admin panel.",
          servicesTitle: "Services",
          servicesSubtitle:
            "Treatments your team publishes from the admin panel appear here automatically.",
          servicesEmpty:
            "No services yet. Add them under Staff → Website & slots → Services.",
          galleryTitle: "Gallery",
          gallerySubtitle:
            "Before & after moments and clinic life — curated by your team.",
          galleryEmpty:
            "No photos yet. Add images from the admin panel → Website & slots → Gallery.",
          blogTitle: "Blog",
          blogSubtitle: "Oral health tips and clinic updates — edited by your team.",
          blogEmpty: "No published posts yet. Add posts from the admin panel.",
          captionTitle: "Your clinic, your story",
          captionSubtitle: "Staff edit copy, services, and gallery from one place.",
          ctaPrimary: "Book a visit",
          ctaSecondary: "Explore services",
          heroEmpty:
            "Set a hero image from the admin panel — or enjoy this soft gradient for now.",
        }

  const navBadge = m.nav?.badge?.trim() || defaults.navBadge
  const navTitle = m.nav?.title?.trim() || clinicName
  const footerLegalLine = m.footer?.legalLine?.trim() || defaults.footerLegal
  const metaTitle = m.meta?.title?.trim() || clinicName
  const metaDescription =
    m.meta?.description?.trim() || heroSubtitle || defaults.metaDescription

  const bookPageTitle = m.pages?.book?.title?.trim() || defaults.bookTitle
  const bookPageSubtitle = m.pages?.book?.subtitle?.trim() || defaults.bookSubtitle
  const servicesPageTitle = m.pages?.services?.title?.trim() || defaults.servicesTitle
  const servicesPageSubtitle =
    m.pages?.services?.subtitle?.trim() || defaults.servicesSubtitle
  const servicesEmptyMessage = m.pages?.services?.empty?.trim() || defaults.servicesEmpty
  const galleryPageTitle = m.pages?.gallery?.title?.trim() || defaults.galleryTitle
  const galleryPageSubtitle =
    m.pages?.gallery?.subtitle?.trim() || defaults.gallerySubtitle
  const galleryEmptyMessage = m.pages?.gallery?.empty?.trim() || defaults.galleryEmpty
  const blogPageTitle = m.pages?.blog?.title?.trim() || defaults.blogTitle
  const blogPageSubtitle = m.pages?.blog?.subtitle?.trim() || defaults.blogSubtitle
  const blogEmptyMessage = m.pages?.blog?.empty?.trim() || defaults.blogEmpty

  const customFeatures = m.home?.features?.filter(
    (f) => f.title.trim().length > 0 || f.description.trim().length > 0
  )
  const defaultFeatures = locale === "ar" ? DEFAULT_FEATURES_AR : DEFAULT_FEATURES_EN
  const homeFeatures =
    customFeatures && customFeatures.length > 0 ? customFeatures : defaultFeatures

  const homeImageCaptionTitle =
    m.home?.imageCaption?.title?.trim() || defaults.captionTitle
  const homeImageCaptionSubtitle =
    m.home?.imageCaption?.subtitle?.trim() || defaults.captionSubtitle
  const homeCtaPrimary = m.home?.ctas?.primary?.trim() || defaults.ctaPrimary
  const homeCtaSecondary = m.home?.ctas?.secondary?.trim() || defaults.ctaSecondary
  const homeHeroEmptyHint = m.home?.heroEmptyHint?.trim() || defaults.heroEmpty

  return {
    clinicName,
    heroTitle,
    heroSubtitle,
    heroImageBase64: row.heroImageBase64,
    aboutMarkdown: pickLocalized(locale, row.aboutMarkdown, row.aboutMarkdownAr) || null,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    address: pickLocalized(locale, row.address, row.addressAr) || null,
    footerNote: pickLocalized(locale, row.footerNote, row.footerNoteAr) || null,
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

const FALLBACK_SITE_ROW: SiteRow = {
  clinicName: "Elkood Dental",
  clinicNameAr: null,
  heroTitle: "Smile with confidence",
  heroTitleAr: null,
  heroSubtitle: "Modern dentistry, gentle care.",
  heroSubtitleAr: null,
  heroImageBase64: null,
  aboutMarkdown: null,
  aboutMarkdownAr: null,
  contactPhone: null,
  contactEmail: null,
  facebookUrl: null,
  instagramUrl: null,
  address: null,
  addressAr: null,
  footerNote: null,
  footerNoteAr: null,
  marketingContent: null,
}

export async function getPublicSite(locale?: Locale): Promise<PublicSite> {
  const resolvedLocale = locale ?? (await getServerLocale())
  try {
    await ensureSiteSettings()
    const row = await prisma.siteSettings.findUniqueOrThrow({
      where: { id: "default" },
    })
    return mergePublicSite(row, resolvedLocale)
  } catch (error) {
    console.error("[getPublicSite] falling back to defaults:", error)
    return mergePublicSite(FALLBACK_SITE_ROW, resolvedLocale)
  }
}
