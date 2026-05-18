import { pickLocalized, type Locale } from "@/lib/locale"

export function localizeService<T extends {
  title: string
  titleAr?: string | null
  description: string
  descriptionAr?: string | null
  priceLabel?: string | null
  priceLabelAr?: string | null
}>(item: T, locale: Locale) {
  return {
    ...item,
    title: pickLocalized(locale, item.title, item.titleAr),
    description: pickLocalized(locale, item.description, item.descriptionAr),
    priceLabel: item.priceLabel
      ? pickLocalized(locale, item.priceLabel, item.priceLabelAr)
      : null,
  }
}

export function localizeBlogPost<T extends {
  title: string
  titleAr?: string | null
  excerpt?: string | null
  excerptAr?: string | null
  content: string
  contentAr?: string | null
}>(item: T, locale: Locale) {
  return {
    ...item,
    title: pickLocalized(locale, item.title, item.titleAr),
    excerpt: item.excerpt
      ? pickLocalized(locale, item.excerpt, item.excerptAr)
      : null,
    content: pickLocalized(locale, item.content, item.contentAr),
  }
}

export function localizeGalleryImage<T extends {
  caption?: string | null
  captionAr?: string | null
}>(item: T, locale: Locale) {
  return {
    ...item,
    caption: item.caption
      ? pickLocalized(locale, item.caption, item.captionAr)
      : null,
  }
}
