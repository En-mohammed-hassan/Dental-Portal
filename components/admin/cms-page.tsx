"use client"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CmsLocaleTabs } from "@/components/admin/cms-locale-tabs"
import { cmsContentDir, useUiDirection } from "@/lib/i18n/use-ui-direction"
import { normalizeMarketingContent } from "@/lib/marketing-content"
import type { Locale } from "@/lib/locale"
import {
  type MarketingContentInput,
  type MarketingContentLocales,
} from "@/types/public-site"

async function api<T>(url: string, init?: RequestInit, fallbackError?: string): Promise<T> {
  const hasBody = Boolean(init?.body)
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  })
  const data = (await res.json().catch(() => ({}))) as T & { message?: string; issues?: string[] }
  if (!res.ok) {
    const d = data as { message?: string; issues?: string[] }
    const msg =
      d.message || (d.issues?.length ? d.issues.join("; ") : null) || fallbackError || "Request failed"
    throw new Error(msg)
  }
  return data as T
}

const MAX_CMS_IMAGE_BYTES = 3 * 1024 * 1024

type ImageMessages = {
  chooseFile: string
  tooLarge: string
  readFailed: string
}

function readImageDataUrl(file: File, messages: ImageMessages): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error(messages.chooseFile))
      return
    }
    if (file.size > MAX_CMS_IMAGE_BYTES) {
      reject(new Error(messages.tooLarge))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r !== "string") {
        reject(new Error(messages.readFailed))
      } else {
        resolve(r)
      }
    }
    reader.onerror = () => reject(new Error(messages.readFailed))
    reader.readAsDataURL(file)
  })
}

function emptyMarketingLocale(): MarketingContentInput {
  return {
    home: {
      features: [
        { title: "", description: "" },
        { title: "", description: "" },
        { title: "", description: "" },
      ],
    },
  }
}

function normalizeFeatures(mc: MarketingContentInput): MarketingContentInput {
  const f = mc.home?.features ?? []
  return {
    ...mc,
    home: {
      ...mc.home,
      features: [
        f[0] ?? { title: "", description: "" },
        f[1] ?? { title: "", description: "" },
        f[2] ?? { title: "", description: "" },
      ],
    },
  }
}

export function CmsPage() {
  const { t } = useTranslation("admin")
  const { dir: uiDir } = useUiDirection()
  const imageMessages: ImageMessages = {
    chooseFile: t("cms.imageChooseFile"),
    tooLarge: t("cms.imageTooLarge"),
    readFailed: t("cms.imageReadFailed"),
  }
  const [savingSite, setSavingSite] = useState(false)
  const [copyLocale, setCopyLocale] = useState<Locale>("en")
  const [site, setSite] = useState({
    clinicName: "",
    clinicNameAr: "",
    heroTitle: "",
    heroTitleAr: "",
    heroSubtitle: "",
    heroSubtitleAr: "",
    heroImageBase64: "",
    aboutMarkdown: "",
    aboutMarkdownAr: "",
    contactPhone: "",
    contactEmail: "",
    facebookUrl: "",
    instagramUrl: "",
    address: "",
    addressAr: "",
    footerNote: "",
    footerNoteAr: "",
  })
  const [marketing, setMarketing] = useState<MarketingContentLocales>({
    en: emptyMarketingLocale(),
    ar: emptyMarketingLocale(),
  })

  const marketingLocale = marketing[copyLocale] ?? emptyMarketingLocale()
  const setMarketingLocale = (
    updater: (prev: MarketingContentInput) => MarketingContentInput
  ) => {
    setMarketing((prev) => ({
      ...prev,
      [copyLocale]: normalizeFeatures(updater(prev[copyLocale] ?? emptyMarketingLocale())),
    }))
  }

  const loadSite = useCallback(async () => {
    const d = await api<{
      site: typeof site & { marketingContent?: unknown }
    }>("/api/admin/site-settings")
    setSite({
      clinicName: d.site.clinicName,
      clinicNameAr: d.site.clinicNameAr ?? "",
      heroTitle: d.site.heroTitle,
      heroTitleAr: d.site.heroTitleAr ?? "",
      heroSubtitle: d.site.heroSubtitle,
      heroSubtitleAr: d.site.heroSubtitleAr ?? "",
      heroImageBase64: d.site.heroImageBase64 ?? "",
      aboutMarkdown: d.site.aboutMarkdown ?? "",
      aboutMarkdownAr: d.site.aboutMarkdownAr ?? "",
      contactPhone: d.site.contactPhone ?? "",
      contactEmail: d.site.contactEmail ?? "",
      facebookUrl: d.site.facebookUrl ?? "",
      instagramUrl: d.site.instagramUrl ?? "",
      address: d.site.address ?? "",
      addressAr: d.site.addressAr ?? "",
      footerNote: d.site.footerNote ?? "",
      footerNoteAr: d.site.footerNoteAr ?? "",
    })
    const normalized = normalizeMarketingContent(d.site.marketingContent)
    setMarketing({
      en: normalizeFeatures(normalized.en ?? {}),
      ar: normalizeFeatures(normalized.ar ?? {}),
    })
  }, [])

  useEffect(() => {
    void loadSite().catch(() => toast.error(t("cms.loadSiteFailed")))
  }, [loadSite, t])

  async function saveSite() {
    setSavingSite(true)
    try {
      await api("/api/admin/site-settings", {
        method: "PUT",
        body: JSON.stringify({
          ...site,
          clinicNameAr: site.clinicNameAr || null,
          heroTitleAr: site.heroTitleAr || null,
          heroSubtitleAr: site.heroSubtitleAr || null,
          aboutMarkdownAr: site.aboutMarkdownAr || null,
          addressAr: site.addressAr || null,
          footerNoteAr: site.footerNoteAr || null,
          heroImageBase64: site.heroImageBase64 || null,
          aboutMarkdown: site.aboutMarkdown || null,
          contactPhone: site.contactPhone || null,
          contactEmail: site.contactEmail || null,
          facebookUrl: site.facebookUrl || null,
          instagramUrl: site.instagramUrl || null,
          address: site.address || null,
          footerNote: site.footerNote || null,
          marketingContent: marketing,
        }),
      })
      toast.success(t("cms.saved"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("cms.saveFailed"))
    } finally {
      setSavingSite(false)
    }
  }

  return (
    <div dir={uiDir} className="cms-site-form space-y-6 text-start">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {t("cms.title")}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t("cms.subtitle")}</p>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList className="flex h-auto w-full min-w-0 flex-wrap justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="site">{t("cms.tabs.site")}</TabsTrigger>
          <TabsTrigger value="slots">{t("cms.tabs.slots")}</TabsTrigger>
          <TabsTrigger value="services">{t("cms.tabs.services")}</TabsTrigger>
          <TabsTrigger value="blog">{t("cms.tabs.blog")}</TabsTrigger>
          <TabsTrigger value="gallery">{t("cms.tabs.gallery")}</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="space-y-4 pt-4">
          <Card>
            <CardHeader className="text-start">
              <CardTitle>{t("cms.site.homepageTitle")}</CardTitle>
              <CardDescription>{t("cms.site.homepageDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="cms-bilingual-form grid gap-4 text-start sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.clinicNameEn")}</Label>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  value={site.clinicName}
                  onChange={(e) => setSite((s) => ({ ...s, clinicName: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.clinicNameAr")}</Label>
                <Input
                  dir="rtl"
                  className="cms-field-ar"
                  value={site.clinicNameAr}
                  onChange={(e) => setSite((s) => ({ ...s, clinicNameAr: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cms.site.heroTitleEn")}</Label>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  value={site.heroTitle}
                  onChange={(e) => setSite((s) => ({ ...s, heroTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cms.site.heroTitleAr")}</Label>
                <Input
                  dir="rtl"
                  className="cms-field-ar"
                  value={site.heroTitleAr}
                  onChange={(e) => setSite((s) => ({ ...s, heroTitleAr: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cms.site.heroSubtitleEn")}</Label>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  value={site.heroSubtitle}
                  onChange={(e) => setSite((s) => ({ ...s, heroSubtitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cms.site.heroSubtitleAr")}</Label>
                <Input
                  dir="rtl"
                  className="cms-field-ar"
                  value={site.heroSubtitleAr}
                  onChange={(e) => setSite((s) => ({ ...s, heroSubtitleAr: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.heroImage")}</Label>
                <p className="text-muted-foreground text-xs">
                  {t("cms.site.heroImageHint")}
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    void readImageDataUrl(f, imageMessages)
                      .then((data) => setSite((s) => ({ ...s, heroImageBase64: data })))
                      .catch((err) => toast.error(err instanceof Error ? err.message : t("actions.failed")))
                    e.target.value = ""
                  }}
                />
                {site.heroImageBase64 ? (
                  <div className="flex flex-wrap items-end gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={site.heroImageBase64}
                      alt=""
                      className="max-h-36 rounded-lg border object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSite((s) => ({ ...s, heroImageBase64: "" }))}
                    >
                      {t("cms.site.removeImage")}
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.aboutEn")}</Label>
                <Textarea
                  rows={5}
                  dir="ltr"
                  className="cms-field-en"
                  value={site.aboutMarkdown}
                  onChange={(e) => setSite((s) => ({ ...s, aboutMarkdown: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.aboutAr")}</Label>
                <Textarea
                  rows={5}
                  dir="rtl"
                  className="cms-field-ar"
                  value={site.aboutMarkdownAr}
                  onChange={(e) => setSite((s) => ({ ...s, aboutMarkdownAr: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cms.site.contactPhone")}</Label>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  value={site.contactPhone}
                  onChange={(e) => setSite((s) => ({ ...s, contactPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cms.site.contactEmail")}</Label>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  value={site.contactEmail}
                  onChange={(e) => setSite((s) => ({ ...s, contactEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cms.site.facebookUrl")}</Label>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  placeholder="https://facebook.com/yourpage"
                  value={site.facebookUrl}
                  onChange={(e) => setSite((s) => ({ ...s, facebookUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cms.site.instagramUrl")}</Label>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  placeholder="https://instagram.com/yourpage"
                  value={site.instagramUrl}
                  onChange={(e) => setSite((s) => ({ ...s, instagramUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.addressEn")}</Label>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  value={site.address}
                  onChange={(e) => setSite((s) => ({ ...s, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.addressAr")}</Label>
                <Input
                  dir="rtl"
                  className="cms-field-ar"
                  value={site.addressAr}
                  onChange={(e) => setSite((s) => ({ ...s, addressAr: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.footerNoteEn")}</Label>
                <p className="text-muted-foreground text-xs">
                  {t("cms.site.footerNoteHint")}
                </p>
                <Input
                  dir="ltr"
                  className="cms-field-en"
                  value={site.footerNote}
                  onChange={(e) => setSite((s) => ({ ...s, footerNote: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("cms.site.footerNoteAr")}</Label>
                <Input
                  dir="rtl"
                  className="cms-field-ar"
                  value={site.footerNoteAr}
                  onChange={(e) => setSite((s) => ({ ...s, footerNoteAr: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-start">
              <CardTitle>{t("cms.site.brandingTitle")}</CardTitle>
              <CardDescription>{t("cms.site.brandingDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 text-start">
              <CmsLocaleTabs value={copyLocale} onChange={setCopyLocale} />
              <div
                key={copyLocale}
                dir={cmsContentDir(copyLocale)}
                className="cms-marketing-form space-y-8 text-start"
              >
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("cms.site.header")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("cms.site.badgeLabel")}</Label>
                    <Input
                      placeholder={t("cms.site.badgePlaceholder")}
                      value={marketingLocale.nav?.badge ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          nav: { ...m.nav, badge: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("cms.site.navTitleLabel")}</Label>
                    <p className="text-muted-foreground text-xs">{t("cms.site.navTitleHint")}</p>
                    <Input
                      placeholder={t("cms.site.navTitlePlaceholder")}
                      value={marketingLocale.nav?.title ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          nav: { ...m.nav, title: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t("cms.site.seo")}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("cms.site.metaTitle")}</Label>
                    <Input
                      placeholder={t("cms.site.metaTitlePlaceholder")}
                      value={marketingLocale.meta?.title ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          meta: { ...m.meta, title: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("cms.site.metaDescription")}</Label>
                    <Textarea
                      rows={2}
                      placeholder={t("cms.site.metaDescriptionPlaceholder")}
                      value={marketingLocale.meta?.description ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          meta: { ...m.meta, description: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("cms.site.footer")}</h3>
                <div className="space-y-2">
                  <Label>{t("cms.site.legalLine")}</Label>
                  <Textarea
                    rows={2}
                    placeholder={t("cms.site.legalLinePlaceholder")}
                    value={marketingLocale.footer?.legalLine ?? ""}
                    onChange={(e) =>
                      setMarketingLocale((m) => ({
                        ...m,
                        footer: { ...m.footer, legalLine: e.target.value },
                      }))
                    }
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("cms.site.pageIntros")}</h3>
                <p className="text-muted-foreground text-xs">
                  {t("cms.site.pageIntrosHint")}
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  {(
                    [
                      ["book", t("cms.site.pageBook")],
                      ["services", t("cms.site.pageServices")],
                      ["gallery", t("cms.site.pageGallery")],
                      ["blog", t("cms.site.pageBlog")],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-2 rounded-lg border p-3">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>
                      <Input
                        placeholder={t("cms.site.pageTitlePlaceholder")}
                        value={marketingLocale.pages?.[key]?.title ?? ""}
                        onChange={(e) =>
                          setMarketingLocale((m) => ({
                            ...m,
                            pages: {
                              ...m.pages,
                              [key]: { ...m.pages?.[key], title: e.target.value },
                            },
                          }))
                        }
                      />
                      <Textarea
                        rows={2}
                        placeholder={t("cms.site.subtitlePlaceholder")}
                        value={marketingLocale.pages?.[key]?.subtitle ?? ""}
                        onChange={(e) =>
                          setMarketingLocale((m) => ({
                            ...m,
                            pages: {
                              ...m.pages,
                              [key]: { ...m.pages?.[key], subtitle: e.target.value },
                            },
                          }))
                        }
                      />
                      {key !== "book" ? (
                        <Input
                          placeholder={t("cms.site.emptyPlaceholder")}
                          value={
                            (marketingLocale.pages?.[key] as { empty?: string } | undefined)?.empty ?? ""
                          }
                          onChange={(e) =>
                            setMarketingLocale((m) => ({
                              ...m,
                              pages: {
                                ...m.pages,
                                [key]: {
                                  ...m.pages?.[key],
                                  empty: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("cms.site.homeExtras")}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("cms.site.ctaPrimary")}</Label>
                    <Input
                      placeholder={t("cms.site.ctaPrimaryPlaceholder")}
                      value={marketingLocale.home?.ctas?.primary ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          home: {
                            ...m.home,
                            ctas: { ...m.home?.ctas, primary: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("cms.site.ctaSecondary")}</Label>
                    <Input
                      placeholder={t("cms.site.ctaSecondaryPlaceholder")}
                      value={marketingLocale.home?.ctas?.secondary ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          home: {
                            ...m.home,
                            ctas: { ...m.home?.ctas, secondary: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("cms.site.captionTitle")}</Label>
                    <Input
                      value={marketingLocale.home?.imageCaption?.title ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          home: {
                            ...m.home,
                            imageCaption: {
                              ...m.home?.imageCaption,
                              title: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("cms.site.captionSubtitle")}</Label>
                    <Input
                      value={marketingLocale.home?.imageCaption?.subtitle ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          home: {
                            ...m.home,
                            imageCaption: {
                              ...m.home?.imageCaption,
                              subtitle: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>{t("cms.site.noHeroHint")}</Label>
                    <Textarea
                      rows={2}
                      placeholder={t("cms.site.noHeroPlaceholder")}
                      value={marketingLocale.home?.heroEmptyHint ?? ""}
                      onChange={(e) =>
                        setMarketingLocale((m) => ({
                          ...m,
                          home: { ...m.home, heroEmptyHint: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">{t("cms.site.featuresHint")}</p>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>{t("cms.site.featureTitle", { n: i + 1 })}</Label>
                      <Input
                        value={marketingLocale.home?.features?.[i]?.title ?? ""}
                        onChange={(e) => {
                          const features = [...(marketingLocale.home?.features ?? [])]
                          while (features.length <= i) {
                            features.push({ title: "", description: "" })
                          }
                          features[i] = {
                            ...features[i],
                            title: e.target.value,
                            description: features[i]?.description ?? "",
                          }
                          setMarketingLocale((m) => ({
                            ...m,
                            home: { ...m.home, features },
                          }))
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>{t("cms.site.featureDesc", { n: i + 1 })}</Label>
                      <Input
                        value={marketingLocale.home?.features?.[i]?.description ?? ""}
                        onChange={(e) => {
                          const features = [...(marketingLocale.home?.features ?? [])]
                          while (features.length <= i) {
                            features.push({ title: "", description: "" })
                          }
                          features[i] = {
                            title: features[i]?.title ?? "",
                            description: e.target.value,
                          }
                          setMarketingLocale((m) => ({
                            ...m,
                            home: { ...m.home, features },
                          }))
                        }}
                      />
                    </div>
                  </div>
                ))}
              </section>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="text-start text-xs text-slate-600 dark:text-slate-400">
              {t("cms.saveSiteHint")}
            </p>
            <LoadingButton
              type="button"
              loading={savingSite}
              loadingText={t("actions.saving")}
              onClick={() => void saveSite()}
            >
              {t("cms.saveSite")}
            </LoadingButton>
          </div>
        </TabsContent>

        <TabsContent value="slots" className="pt-4">
          <SlotsTab />
        </TabsContent>
        <TabsContent value="services" className="pt-4">
          <ServicesTab />
        </TabsContent>
        <TabsContent value="blog" className="pt-4">
          <BlogTab />
        </TabsContent>
        <TabsContent value="gallery" className="pt-4">
          <GalleryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

type AdminSlotRow = {
  id: string
  startsAt: string
  endsAt: string
  capacity: number
  label: string | null
  isActive: boolean
  taken: number
  remaining: number
}

type SlotsListResponse = {
  slots: AdminSlotRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  window: string
}

function SlotsTab() {
  const { t } = useTranslation("admin")
  const imageMessages: ImageMessages = {
    chooseFile: t("cms.imageChooseFile"),
    tooLarge: t("cms.imageTooLarge"),
    readFailed: t("cms.imageReadFailed"),
  }
  const [addingSlot, setAddingSlot] = useState(false)
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [slots, setSlots] = useState<AdminSlotRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [windowFilter, setWindowFilter] = useState<"upcoming" | "past" | "all">("upcoming")
  const [qInput, setQInput] = useState("")
  const [q, setQ] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [capacity, setCapacity] = useState("1")
  const [label, setLabel] = useState("")

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(qInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [qInput])

  const load = useCallback(async () => {
    setSlotsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        window: windowFilter,
      })
      if (q) {
        params.set("q", q)
      }
      const d = await api<SlotsListResponse>(`/api/admin/booking-slots?${params.toString()}`)
      setSlots(d.slots)
      setTotal(d.total)
      setTotalPages(d.totalPages)
      if (page > d.totalPages && d.totalPages >= 1) {
        setPage(d.totalPages)
      }
    } catch {
      toast.error(t("cms.slots.loadFailed"))
    } finally {
      setSlotsLoading(false)
    }
  }, [page, pageSize, windowFilter, q])

  useEffect(() => {
    void load()
  }, [load])

  async function addSlot() {
    setAddingSlot(true)
    try {
      await api("/api/admin/booking-slots", {
        method: "POST",
        body: JSON.stringify({
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          capacity: Number(capacity) || 1,
          label: label || null,
        }),
      })
      toast.success(t("cms.slots.added"))
      setStartsAt("")
      setEndsAt("")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    } finally {
      setAddingSlot(false)
    }
  }

  async function remove(id: string) {
    setDeletingSlotId(id)
    try {
      await api(`/api/admin/booking-slots/${id}`, { method: "DELETE" })
      toast.success(t("cms.slots.removed"))
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    } finally {
      setDeletingSlotId(null)
    }
  }

  async function setSlotActive(id: string, isActive: boolean) {
    try {
      await api(`/api/admin/booking-slots/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      })
      toast.success(isActive ? t("cms.slots.visibleOnBook") : t("cms.slots.hiddenFromBook"))
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cms.slots.title")}</CardTitle>
        <CardDescription className="text-start">{t("cms.slots.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>{t("cms.slots.starts")}</Label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("cms.slots.ends")}</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("cms.slots.capacity")}</Label>
            <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("cms.slots.labelOptional")}</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("cms.slots.labelPlaceholder")} />
          </div>
        </div>
        <LoadingButton
          type="button"
          loading={addingSlot}
          loadingText={t("actions.adding")}
          onClick={() => void addSlot()}
          disabled={!startsAt || !endsAt}
        >
          {t("cms.slots.addSlot")}
        </LoadingButton>

        <div className="space-y-4 border-t border-slate-200/80 pt-6 dark:border-slate-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="space-y-1 lg:min-w-[200px]">
              <Label>{t("cms.slots.timeRange")}</Label>
              <Select
                value={windowFilter}
                onValueChange={(v) => {
                  setWindowFilter(v as "upcoming" | "past" | "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("cms.slots.rangePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">{t("cms.slots.upcoming")}</SelectItem>
                  <SelectItem value="past">{t("cms.slots.past")}</SelectItem>
                  <SelectItem value="all">{t("cms.slots.all")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-1 lg:max-w-md">
              <Label htmlFor="slot-search">{t("cms.slots.labelContains")}</Label>
              <Input
                id="slot-search"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder={t("cms.slots.searchLabel")}
              />
            </div>
            <div className="space-y-1 lg:min-w-[120px]">
              <Label>{t("cms.slots.perPage")}</Label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-start text-xs">
              {slotsLoading
                ? t("actions.loading")
                : total === 0
                  ? t("cms.slots.noMatch")
                  : t("cms.slots.showing", {
                      from: (page - 1) * pageSize + 1,
                      to: Math.min(page * pageSize, total),
                      total,
                    })}
            </p>
            <div className="flex flex-wrap items-center gap-2 [dir=rtl]:flex-row-reverse">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={slotsLoading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("actions.previous")}
              </Button>
              <span className="text-muted-foreground text-xs tabular-nums">
                {t("cms.slots.pageOf", { page, total: totalPages })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={slotsLoading || page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("actions.next")}
              </Button>
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            {slotsLoading ? (
              <li className="text-muted-foreground py-8 text-center text-sm">{t("cms.slots.loadingSlots")}</li>
            ) : slots.length === 0 ? (
              <li className="text-muted-foreground py-8 text-center text-sm">{t("cms.slots.noRows")}</li>
            ) : (
              slots.map((s) => {
                const ended = new Date(s.endsAt).getTime() <= Date.now()
                return (
                  <li
                    key={s.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200/80 px-3 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1 text-start">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        <span dir="ltr" className="inline-block">
                          {new Date(s.startsAt).toLocaleString()} – {new Date(s.endsAt).toLocaleString()}
                        </span>
                        {s.label ? ` · ${s.label}` : ""} · {t("cms.slots.capacity")} {s.capacity} ·{" "}
                        {s.taken}/{s.capacity} {t("cms.slots.booked")}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {!s.isActive ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                            {t("cms.slots.offNotShown")}
                          </span>
                        ) : ended ? (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                            {t("cms.slots.endedNotShown")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900 dark:bg-teal-950/50 dark:text-teal-100">
                            {t("cms.slots.liveOnBook")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 sm:ms-auto sm:justify-end">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`slot-active-${s.id}`} className="text-xs whitespace-nowrap">
                          {t("cms.slots.active")}
                        </Label>
                        <Switch
                          id={`slot-active-${s.id}`}
                          checked={s.isActive}
                          onCheckedChange={(v) => void setSlotActive(s.id, v)}
                        />
                      </div>
                      <LoadingButton
                        size="sm"
                        variant="destructive"
                        type="button"
                        loading={deletingSlotId === s.id}
                        loadingText="…"
                        disabled={deletingSlotId !== null && deletingSlotId !== s.id}
                        onClick={() => void remove(s.id)}
                      >
                        {t("actions.delete")}
                      </LoadingButton>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function ServicesTab() {
  const { t } = useTranslation("admin")
  const imageMessages: ImageMessages = {
    chooseFile: t("cms.imageChooseFile"),
    tooLarge: t("cms.imageTooLarge"),
    readFailed: t("cms.imageReadFailed"),
  }
  const [addingService, setAddingService] = useState(false)
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null)
  const [items, setItems] = useState<
    Array<{
      id: string
      title: string
      description: string
      priceLabel: string | null
      imageBase64: string | null
      published: boolean
    }>
  >([])
  const [title, setTitle] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [description, setDescription] = useState("")
  const [descriptionAr, setDescriptionAr] = useState("")
  const [priceLabel, setPriceLabel] = useState("")
  const [priceLabelAr, setPriceLabelAr] = useState("")
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null)

  const load = useCallback(async () => {
    const d = await api<{ items: typeof items }>("/api/admin/services")
    setItems(d.items)
  }, [])

  useEffect(() => {
    void load().catch(() => toast.error(t("cms.services.loadFailed")))
  }, [load])

  async function add() {
    setAddingService(true)
    try {
      await api("/api/admin/services", {
        method: "POST",
        body: JSON.stringify({
          title,
          titleAr: titleAr || null,
          description,
          descriptionAr: descriptionAr || null,
          priceLabel: priceLabel || null,
          priceLabelAr: priceLabelAr || null,
          imageBase64: newImageBase64 ?? null,
        }),
      })
      toast.success(t("cms.services.added"))
      setTitle("")
      setTitleAr("")
      setDescription("")
      setDescriptionAr("")
      setPriceLabel("")
      setPriceLabelAr("")
      setNewImageBase64(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    } finally {
      setAddingService(false)
    }
  }

  async function remove(id: string) {
    setDeletingServiceId(id)
    try {
      await api(`/api/admin/services/${id}`, { method: "DELETE" })
      toast.success(t("actions.remove"))
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    } finally {
      setDeletingServiceId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cms.services.title")}</CardTitle>
        <CardDescription>{t("cms.services.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>{t("cms.services.titleEn")}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("cms.services.titleAr")}</Label>
          <Input dir="rtl" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("cms.services.descriptionEn")}</Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("cms.services.descriptionAr")}</Label>
          <Textarea
            rows={3}
            dir="rtl"
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("cms.services.priceEn")}</Label>
          <Input
            placeholder={t("cms.services.pricePlaceholderEn")}
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("cms.services.priceAr")}</Label>
          <Input
            dir="rtl"
            placeholder={t("cms.services.pricePlaceholderAr")}
            value={priceLabelAr}
            onChange={(e) => setPriceLabelAr(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("cms.services.imageOptional")}</Label>
          <Input
            type="file"
            accept="image/*"
            className="cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              void readImageDataUrl(f, imageMessages)
                .then(setNewImageBase64)
                .catch((err) => toast.error(err instanceof Error ? err.message : t("actions.failed")))
              e.target.value = ""
            }}
          />
          {newImageBase64 ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={newImageBase64} alt="" className="h-14 w-20 rounded border object-cover" />
              <Button type="button" variant="outline" size="sm" onClick={() => setNewImageBase64(null)}>
                {t("actions.clear")}
              </Button>
            </div>
          ) : null}
        </div>
        <LoadingButton
          type="button"
          loading={addingService}
          loadingText={t("actions.adding")}
          onClick={() => void add()}
          disabled={!title || !description}
        >
          {t("cms.services.addService")}
        </LoadingButton>
        <ul className="space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 flex-1 items-center gap-3">
                {s.imageBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imageBase64}
                    alt=""
                    className="h-10 w-14 shrink-0 rounded border object-cover"
                  />
                ) : null}
                <span className="min-w-0 truncate">
                  {s.title} {s.published ? "" : t("cms.services.hidden")}
                </span>
              </span>
              <LoadingButton
                size="sm"
                variant="destructive"
                type="button"
                loading={deletingServiceId === s.id}
                loadingText="…"
                disabled={deletingServiceId !== null && deletingServiceId !== s.id}
                onClick={() => void remove(s.id)}
              >
                {t("actions.delete")}
              </LoadingButton>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function BlogTab() {
  const { t } = useTranslation("admin")
  const imageMessages: ImageMessages = {
    chooseFile: t("cms.imageChooseFile"),
    tooLarge: t("cms.imageTooLarge"),
    readFailed: t("cms.imageReadFailed"),
  }
  const [addingPost, setAddingPost] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [posts, setPosts] = useState<
    Array<{ id: string; slug: string; title: string; published: boolean }>
  >([])
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [excerptAr, setExcerptAr] = useState("")
  const [content, setContent] = useState("")
  const [contentAr, setContentAr] = useState("")
  const [coverImageBase64, setCoverImageBase64] = useState<string | null>(null)

  const load = useCallback(async () => {
    const d = await api<{ posts: typeof posts }>("/api/admin/blog")
    setPosts(d.posts)
  }, [])

  useEffect(() => {
    void load().catch(() => toast.error(t("cms.blog.loadFailed")))
  }, [load])

  async function add() {
    setAddingPost(true)
    try {
      await api("/api/admin/blog", {
        method: "POST",
        body: JSON.stringify({
          slug,
          title,
          titleAr: titleAr || null,
          excerpt: excerpt || null,
          excerptAr: excerptAr || null,
          content,
          contentAr: contentAr || null,
          coverImageBase64: coverImageBase64 ?? null,
          published: true,
        }),
      })
      toast.success(t("cms.blog.created"))
      setSlug("")
      setTitle("")
      setTitleAr("")
      setExcerpt("")
      setExcerptAr("")
      setContent("")
      setContentAr("")
      setCoverImageBase64(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    } finally {
      setAddingPost(false)
    }
  }

  async function remove(id: string) {
    setDeletingPostId(id)
    try {
      await api(`/api/admin/blog/${id}`, { method: "DELETE" })
      toast.success(t("actions.remove"))
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    } finally {
      setDeletingPostId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cms.blog.title")}</CardTitle>
        <CardDescription>{t("cms.blog.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{t("cms.blog.slug")}</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={t("cms.blog.slugPlaceholder")} />
          </div>
          <div className="space-y-1">
            <Label>{t("cms.services.titleEn")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("cms.services.titleAr")}</Label>
            <Input dir="rtl" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>{t("cms.blog.excerptEn")}</Label>
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t("cms.blog.excerptAr")}</Label>
          <Input dir="rtl" value={excerptAr} onChange={(e) => setExcerptAr(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t("cms.blog.contentEn")}</Label>
          <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t("cms.blog.contentAr")}</Label>
          <Textarea rows={6} dir="rtl" value={contentAr} onChange={(e) => setContentAr(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t("cms.blog.coverOptional")}</Label>
          <Input
            type="file"
            accept="image/*"
            className="cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              void readImageDataUrl(f, imageMessages)
                .then(setCoverImageBase64)
                .catch((err) => toast.error(err instanceof Error ? err.message : t("actions.failed")))
              e.target.value = ""
            }}
          />
          {coverImageBase64 ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImageBase64} alt="" className="h-16 max-w-xs rounded border object-cover" />
              <Button type="button" variant="outline" size="sm" onClick={() => setCoverImageBase64(null)}>
                {t("actions.clear")}
              </Button>
            </div>
          ) : null}
        </div>
        <LoadingButton
          type="button"
          loading={addingPost}
          loadingText={t("actions.publishing")}
          onClick={() => void add()}
          disabled={!slug || !title || !content}
        >
          {t("cms.blog.publishPost")}
        </LoadingButton>
        <ul className="space-y-2 text-sm">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded border px-3 py-2">
              <span>
                {p.title} ({p.slug}) {p.published ? "" : t("cms.blog.draft")}
              </span>
              <LoadingButton
                size="sm"
                variant="destructive"
                type="button"
                loading={deletingPostId === p.id}
                loadingText="…"
                disabled={deletingPostId !== null && deletingPostId !== p.id}
                onClick={() => void remove(p.id)}
              >
                {t("actions.delete")}
              </LoadingButton>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function GalleryTab() {
  const { t } = useTranslation("admin")
  const imageMessages: ImageMessages = {
    chooseFile: t("cms.imageChooseFile"),
    tooLarge: t("cms.imageTooLarge"),
    readFailed: t("cms.imageReadFailed"),
  }
  const [addingGallery, setAddingGallery] = useState(false)
  const [deletingGalleryId, setDeletingGalleryId] = useState<string | null>(null)
  const [images, setImages] = useState<
    Array<{ id: string; imageBase64: string; caption: string | null }>
  >([])
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [captionAr, setCaptionAr] = useState("")

  const load = useCallback(async () => {
    const d = await api<{ images: typeof images }>("/api/admin/gallery")
    setImages(d.images)
  }, [])

  useEffect(() => {
    void load().catch(() => toast.error(t("cms.gallery.loadFailed")))
  }, [load])

  async function add() {
    if (!pendingImageBase64) {
      toast.error(t("cms.gallery.chooseFirst"))
      return
    }
    setAddingGallery(true)
    try {
      await api("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify({
          imageBase64: pendingImageBase64,
          caption: caption || null,
          captionAr: captionAr || null,
        }),
      })
      toast.success(t("cms.gallery.added"))
      setPendingImageBase64(null)
      setCaption("")
      setCaptionAr("")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    } finally {
      setAddingGallery(false)
    }
  }

  async function remove(id: string) {
    setDeletingGalleryId(id)
    try {
      await api(`/api/admin/gallery/${id}`, { method: "DELETE" })
      toast.success(t("cms.slots.removed"))
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actions.failed"))
    } finally {
      setDeletingGalleryId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cms.gallery.title")}</CardTitle>
        <CardDescription>{t("cms.gallery.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>{t("cms.gallery.imageFile")}</Label>
          <Input
            type="file"
            accept="image/*"
            className="cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              void readImageDataUrl(f, imageMessages)
                .then(setPendingImageBase64)
                .catch((err) => toast.error(err instanceof Error ? err.message : t("actions.failed")))
              e.target.value = ""
            }}
          />
          {pendingImageBase64 ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingImageBase64} alt="" className="h-16 w-24 rounded border object-cover" />
              <Button type="button" variant="outline" size="sm" onClick={() => setPendingImageBase64(null)}>
                {t("actions.clear")}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label>{t("cms.gallery.captionEn")}</Label>
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t("cms.gallery.captionAr")}</Label>
          <Input dir="rtl" value={captionAr} onChange={(e) => setCaptionAr(e.target.value)} />
        </div>
        <LoadingButton
          type="button"
          loading={addingGallery}
          loadingText={t("actions.adding")}
          onClick={() => void add()}
          disabled={!pendingImageBase64}
        >
          Add
        </LoadingButton>
        <ul className="space-y-2 text-sm">
          {images.map((img) => (
            <li key={img.id} className="flex items-center justify-between gap-2 rounded border px-3 py-2">
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageBase64}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded border object-cover"
                />
                <span className="truncate text-muted-foreground">{img.caption ?? t("cms.gallery.noCaption")}</span>
              </span>
              <LoadingButton
                size="sm"
                variant="destructive"
                type="button"
                loading={deletingGalleryId === img.id}
                loadingText="…"
                disabled={deletingGalleryId !== null && deletingGalleryId !== img.id}
                onClick={() => void remove(img.id)}
              >
                {t("actions.delete")}
              </LoadingButton>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
