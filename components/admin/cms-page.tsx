"use client"

import { useCallback, useEffect, useState } from "react"
import toast from "react-hot-toast"

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
import {
  marketingContentSchema,
  type MarketingContentInput,
} from "@/types/public-site"

async function api<T>(url: string, init?: RequestInit): Promise<T> {
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
      d.message || (d.issues?.length ? d.issues.join("; ") : null) || "Request failed"
    throw new Error(msg)
  }
  return data as T
}

const MAX_CMS_IMAGE_BYTES = 3 * 1024 * 1024

function readImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"))
      return
    }
    if (file.size > MAX_CMS_IMAGE_BYTES) {
      reject(new Error("Image must be 3MB or smaller"))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r !== "string") {
        reject(new Error("Failed to read image"))
      } else {
        resolve(r)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read image"))
    reader.readAsDataURL(file)
  })
}

export function CmsPage() {
  const [savingSite, setSavingSite] = useState(false)
  const [site, setSite] = useState({
    clinicName: "",
    heroTitle: "",
    heroSubtitle: "",
    heroImageBase64: "",
    aboutMarkdown: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    footerNote: "",
  })
  const [marketing, setMarketing] = useState<MarketingContentInput>({})

  const loadSite = useCallback(async () => {
    const d = await api<{
      site: typeof site & { marketingContent?: unknown }
    }>("/api/admin/site-settings")
    setSite({
      clinicName: d.site.clinicName,
      heroTitle: d.site.heroTitle,
      heroSubtitle: d.site.heroSubtitle,
      heroImageBase64: d.site.heroImageBase64 ?? "",
      aboutMarkdown: d.site.aboutMarkdown ?? "",
      contactPhone: d.site.contactPhone ?? "",
      contactEmail: d.site.contactEmail ?? "",
      address: d.site.address ?? "",
      footerNote: d.site.footerNote ?? "",
    })
    const mcParsed = marketingContentSchema.safeParse(d.site.marketingContent ?? {})
    const mc = mcParsed.success ? mcParsed.data : {}
    const f = mc.home?.features ?? []
    setMarketing({
      ...mc,
      home: {
        ...mc.home,
        features: [
          f[0] ?? { title: "", description: "" },
          f[1] ?? { title: "", description: "" },
          f[2] ?? { title: "", description: "" },
        ],
      },
    })
  }, [])

  useEffect(() => {
    void loadSite().catch(() => toast.error("Could not load site settings"))
  }, [loadSite])

  async function saveSite() {
    setSavingSite(true)
    try {
      await api("/api/admin/site-settings", {
        method: "PUT",
        body: JSON.stringify({
          ...site,
          heroImageBase64: site.heroImageBase64 || null,
          aboutMarkdown: site.aboutMarkdown || null,
          contactPhone: site.contactPhone || null,
          contactEmail: site.contactEmail || null,
          address: site.address || null,
          footerNote: site.footerNote || null,
          marketingContent: marketing,
        }),
      })
      toast.success("Site saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSavingSite(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Website & booking slots
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Control public copy, services, blog, gallery, and patient-facing time slots.
        </p>
      </div>

      <Tabs defaultValue="site" className="w-full">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="site">Site copy</TabsTrigger>
          <TabsTrigger value="slots">Slots</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Homepage & contact</CardTitle>
              <CardDescription>Shown on the public marketing site.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Clinic name</Label>
                <Input
                  value={site.clinicName}
                  onChange={(e) => setSite((s) => ({ ...s, clinicName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Hero title</Label>
                <Input
                  value={site.heroTitle}
                  onChange={(e) => setSite((s) => ({ ...s, heroTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Hero subtitle</Label>
                <Input
                  value={site.heroSubtitle}
                  onChange={(e) => setSite((s) => ({ ...s, heroSubtitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Hero image</Label>
                <p className="text-muted-foreground text-xs">
                  Uploaded images are stored as base64 (data URLs) in the database.
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  className="cursor-pointer"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    void readImageDataUrl(f)
                      .then((data) => setSite((s) => ({ ...s, heroImageBase64: data })))
                      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"))
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
                      Remove image
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>About (plain text / markdown)</Label>
                <Textarea
                  rows={5}
                  value={site.aboutMarkdown}
                  onChange={(e) => setSite((s) => ({ ...s, aboutMarkdown: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact phone</Label>
                <Input
                  value={site.contactPhone}
                  onChange={(e) => setSite((s) => ({ ...s, contactPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Contact email</Label>
                <Input
                  value={site.contactEmail}
                  onChange={(e) => setSite((s) => ({ ...s, contactEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={site.address}
                  onChange={(e) => setSite((s) => ({ ...s, address: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Footer note</Label>
                <p className="text-muted-foreground text-xs">
                  Short message under contact details in the footer (e.g. hours or tagline).
                </p>
                <Input
                  value={site.footerNote}
                  onChange={(e) => setSite((s) => ({ ...s, footerNote: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding &amp; public page text</CardTitle>
              <CardDescription>
                White-label the marketing site: header, SEO, page titles, and home page cards. Leave a
                field empty to use the built-in default for that spot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Header</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Small badge (upper line)</Label>
                    <Input
                      placeholder="e.g. CLINIC NAME"
                      value={marketing.nav?.badge ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
                          ...m,
                          nav: { ...m.nav, badge: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Main title next to badge</Label>
                    <p className="text-muted-foreground text-xs">If empty, uses clinic name above.</p>
                    <Input
                      placeholder="e.g. Smile Studio"
                      value={marketing.nav?.title ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
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
                  SEO (browser tab)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Meta title</Label>
                    <Input
                      placeholder="Default: clinic name"
                      value={marketing.meta?.title ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
                          ...m,
                          meta: { ...m.meta, title: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Meta description</Label>
                    <Textarea
                      rows={2}
                      placeholder="Short summary for Google / social previews"
                      value={marketing.meta?.description ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
                          ...m,
                          meta: { ...m.meta, description: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Footer</h3>
                <div className="space-y-2">
                  <Label>Legal / credit line (bottom right)</Label>
                  <Textarea
                    rows={2}
                    placeholder="Second line under © year — e.g. your company tagline"
                    value={marketing.footer?.legalLine ?? ""}
                    onChange={(e) =>
                      setMarketing((m) => ({
                        ...m,
                        footer: { ...m.footer, legalLine: e.target.value },
                      }))
                    }
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Page intros</h3>
                <p className="text-muted-foreground text-xs">
                  Headlines and helper text on Services, Gallery, Blog, and Book.
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  {(
                    [
                      ["book", "Book"],
                      ["services", "Services"],
                      ["gallery", "Gallery"],
                      ["blog", "Blog"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-2 rounded-lg border p-3">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</p>
                      <Input
                        placeholder="Page title"
                        value={marketing.pages?.[key]?.title ?? ""}
                        onChange={(e) =>
                          setMarketing((m) => ({
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
                        placeholder="Subtitle"
                        value={marketing.pages?.[key]?.subtitle ?? ""}
                        onChange={(e) =>
                          setMarketing((m) => ({
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
                          placeholder="Empty state message"
                          value={
                            (marketing.pages?.[key] as { empty?: string } | undefined)?.empty ?? ""
                          }
                          onChange={(e) =>
                            setMarketing((m) => ({
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
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Homepage extras</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary button label</Label>
                    <Input
                      placeholder="Book a visit"
                      value={marketing.home?.ctas?.primary ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
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
                    <Label>Secondary button label</Label>
                    <Input
                      placeholder="Explore services"
                      value={marketing.home?.ctas?.secondary ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
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
                    <Label>Hero image caption — title</Label>
                    <Input
                      value={marketing.home?.imageCaption?.title ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
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
                    <Label>Hero image caption — subtitle</Label>
                    <Input
                      value={marketing.home?.imageCaption?.subtitle ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
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
                    <Label>When no hero image is set</Label>
                    <Textarea
                      rows={2}
                      placeholder="Hint text in the image placeholder"
                      value={marketing.home?.heroEmptyHint ?? ""}
                      onChange={(e) =>
                        setMarketing((m) => ({
                          ...m,
                          home: { ...m.home, heroEmptyHint: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  Three feature cards under the hero (left column). Leave both fields empty on a row to
                  drop that card when saving (defaults apply if all rows empty).
                </p>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Feature {i + 1} title</Label>
                      <Input
                        value={marketing.home?.features?.[i]?.title ?? ""}
                        onChange={(e) => {
                          const features = [...(marketing.home?.features ?? [])]
                          while (features.length <= i) {
                            features.push({ title: "", description: "" })
                          }
                          features[i] = {
                            ...features[i],
                            title: e.target.value,
                            description: features[i]?.description ?? "",
                          }
                          setMarketing((m) => ({
                            ...m,
                            home: { ...m.home, features },
                          }))
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Feature {i + 1} description</Label>
                      <Input
                        value={marketing.home?.features?.[i]?.description ?? ""}
                        onChange={(e) => {
                          const features = [...(marketing.home?.features ?? [])]
                          while (features.length <= i) {
                            features.push({ title: "", description: "" })
                          }
                          features[i] = {
                            title: features[i]?.title ?? "",
                            description: e.target.value,
                          }
                          setMarketing((m) => ({
                            ...m,
                            home: { ...m.home, features },
                          }))
                        }}
                      />
                    </div>
                  </div>
                ))}
              </section>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/40">
            <p className="mr-auto text-xs text-slate-600 dark:text-slate-400">
              Saves homepage fields, contact info, and all branding text above.
            </p>
            <LoadingButton
              type="button"
              loading={savingSite}
              loadingText="Saving…"
              onClick={() => void saveSite()}
            >
              Save all site settings
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
      toast.error("Could not load slots")
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
      toast.success("Slot added")
      setStartsAt("")
      setEndsAt("")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setAddingSlot(false)
    }
  }

  async function remove(id: string) {
    setDeletingSlotId(id)
    try {
      await api(`/api/admin/booking-slots/${id}`, { method: "DELETE" })
      toast.success("Removed")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
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
      toast.success(isActive ? "Slot is visible on /book" : "Slot hidden from /book")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookable slots</CardTitle>
        <CardDescription>
          Only slots that are <strong>Active</strong> and whose <strong>end</strong> is still in the
          future (compared to <strong>server time in UTC</strong>) appear on{" "}
          <code className="text-xs">/book</code>. The datetime picker uses your PC&apos;s local time;
          if a slot disappears later, its <strong>End</strong> has passed in UTC. New slots are rejected
          if the end time is already in the past. Large slot lists are paginated here so the admin UI
          stays fast.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label>Starts</Label>
            <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Ends</Label>
            <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Capacity</Label>
            <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Chair 1" />
          </div>
        </div>
        <LoadingButton
          type="button"
          loading={addingSlot}
          loadingText="Adding…"
          onClick={() => void addSlot()}
          disabled={!startsAt || !endsAt}
        >
          Add slot
        </LoadingButton>

        <div className="space-y-4 border-t border-slate-200/80 pt-6 dark:border-slate-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="space-y-1 lg:min-w-[200px]">
              <Label>Time range</Label>
              <Select
                value={windowFilter}
                onValueChange={(v) => {
                  setWindowFilter(v as "upcoming" | "past" | "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming (not ended)</SelectItem>
                  <SelectItem value="past">Past (ended)</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-1 lg:max-w-md">
              <Label htmlFor="slot-search">Label contains</Label>
              <Input
                id="slot-search"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Search label…"
              />
            </div>
            <div className="space-y-1 lg:min-w-[120px]">
              <Label>Per page</Label>
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
            <p className="text-muted-foreground text-xs">
              {slotsLoading
                ? "Loading…"
                : total === 0
                  ? "No slots match."
                  : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={slotsLoading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-muted-foreground text-xs tabular-nums">
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={slotsLoading || page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            {slotsLoading ? (
              <li className="text-muted-foreground py-8 text-center text-sm">Loading slots…</li>
            ) : slots.length === 0 ? (
              <li className="text-muted-foreground py-8 text-center text-sm">No rows on this page.</li>
            ) : (
              slots.map((s) => {
                const ended = new Date(s.endsAt).getTime() <= Date.now()
                return (
                  <li
                    key={s.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200/80 px-3 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {new Date(s.startsAt).toLocaleString()} → {new Date(s.endsAt).toLocaleString()}
                        {s.label ? ` · ${s.label}` : ""} · cap {s.capacity} · {s.taken}/{s.capacity}{" "}
                        booked
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {!s.isActive ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                            Off — not shown on /book
                          </span>
                        ) : ended ? (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                            Ended — not shown on /book
                          </span>
                        ) : (
                          <span className="rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900 dark:bg-teal-950/50 dark:text-teal-100">
                            Live on /book
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`slot-active-${s.id}`} className="text-xs whitespace-nowrap">
                          Active
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
                        Delete
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
  const [description, setDescription] = useState("")
  const [priceLabel, setPriceLabel] = useState("")
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null)

  const load = useCallback(async () => {
    const d = await api<{ items: typeof items }>("/api/admin/services")
    setItems(d.items)
  }, [])

  useEffect(() => {
    void load().catch(() => toast.error("Could not load services"))
  }, [load])

  async function add() {
    setAddingService(true)
    try {
      await api("/api/admin/services", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          priceLabel: priceLabel || null,
          imageBase64: newImageBase64 ?? null,
        }),
      })
      toast.success("Service added")
      setTitle("")
      setDescription("")
      setPriceLabel("")
      setNewImageBase64(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setAddingService(false)
    }
  }

  async function remove(id: string) {
    setDeletingServiceId(id)
    try {
      await api(`/api/admin/services/${id}`, { method: "DELETE" })
      toast.success("Deleted")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setDeletingServiceId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>Listed on the public /services page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Price label</Label>
          <Input
            placeholder="From $99"
            value={priceLabel}
            onChange={(e) => setPriceLabel(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Image (optional)</Label>
          <Input
            type="file"
            accept="image/*"
            className="cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              void readImageDataUrl(f)
                .then(setNewImageBase64)
                .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"))
              e.target.value = ""
            }}
          />
          {newImageBase64 ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={newImageBase64} alt="" className="h-14 w-20 rounded border object-cover" />
              <Button type="button" variant="outline" size="sm" onClick={() => setNewImageBase64(null)}>
                Clear
              </Button>
            </div>
          ) : null}
        </div>
        <LoadingButton
          type="button"
          loading={addingService}
          loadingText="Adding…"
          onClick={() => void add()}
          disabled={!title || !description}
        >
          Add service
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
                  {s.title} {s.published ? "" : "(hidden)"}
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
                Delete
              </LoadingButton>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function BlogTab() {
  const [addingPost, setAddingPost] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [posts, setPosts] = useState<
    Array<{ id: string; slug: string; title: string; published: boolean }>
  >([])
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [coverImageBase64, setCoverImageBase64] = useState<string | null>(null)

  const load = useCallback(async () => {
    const d = await api<{ posts: typeof posts }>("/api/admin/blog")
    setPosts(d.posts)
  }, [])

  useEffect(() => {
    void load().catch(() => toast.error("Could not load blog"))
  }, [load])

  async function add() {
    setAddingPost(true)
    try {
      await api("/api/admin/blog", {
        method: "POST",
        body: JSON.stringify({
          slug,
          title,
          excerpt: excerpt || null,
          content,
          coverImageBase64: coverImageBase64 ?? null,
          published: true,
        }),
      })
      toast.success("Post created")
      setSlug("")
      setTitle("")
      setExcerpt("")
      setContent("")
      setCoverImageBase64(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setAddingPost(false)
    }
  }

  async function remove(id: string) {
    setDeletingPostId(id)
    try {
      await api(`/api/admin/blog/${id}`, { method: "DELETE" })
      toast.success("Deleted")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setDeletingPostId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blog</CardTitle>
        <CardDescription>URL: /blog/your-slug</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="whitening-tips" />
          </div>
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Excerpt</Label>
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Content</Label>
          <Textarea rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Cover image (optional)</Label>
          <Input
            type="file"
            accept="image/*"
            className="cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              void readImageDataUrl(f)
                .then(setCoverImageBase64)
                .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"))
              e.target.value = ""
            }}
          />
          {coverImageBase64 ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImageBase64} alt="" className="h-16 max-w-xs rounded border object-cover" />
              <Button type="button" variant="outline" size="sm" onClick={() => setCoverImageBase64(null)}>
                Clear
              </Button>
            </div>
          ) : null}
        </div>
        <LoadingButton
          type="button"
          loading={addingPost}
          loadingText="Publishing…"
          onClick={() => void add()}
          disabled={!slug || !title || !content}
        >
          Publish post
        </LoadingButton>
        <ul className="space-y-2 text-sm">
          {posts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded border px-3 py-2">
              <span>
                {p.title} ({p.slug}) {p.published ? "" : "· draft"}
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
                Delete
              </LoadingButton>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function GalleryTab() {
  const [addingGallery, setAddingGallery] = useState(false)
  const [deletingGalleryId, setDeletingGalleryId] = useState<string | null>(null)
  const [images, setImages] = useState<
    Array<{ id: string; imageBase64: string; caption: string | null }>
  >([])
  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null)
  const [caption, setCaption] = useState("")

  const load = useCallback(async () => {
    const d = await api<{ images: typeof images }>("/api/admin/gallery")
    setImages(d.images)
  }, [])

  useEffect(() => {
    void load().catch(() => toast.error("Could not load gallery"))
  }, [load])

  async function add() {
    if (!pendingImageBase64) {
      toast.error("Choose an image first")
      return
    }
    setAddingGallery(true)
    try {
      await api("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify({ imageBase64: pendingImageBase64, caption: caption || null }),
      })
      toast.success("Image added")
      setPendingImageBase64(null)
      setCaption("")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setAddingGallery(false)
    }
  }

  async function remove(id: string) {
    setDeletingGalleryId(id)
    try {
      await api(`/api/admin/gallery/${id}`, { method: "DELETE" })
      toast.success("Removed")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed")
    } finally {
      setDeletingGalleryId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery</CardTitle>
        <CardDescription>Images are stored as base64 in the database.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label>Image file</Label>
          <Input
            type="file"
            accept="image/*"
            className="cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return
              void readImageDataUrl(f)
                .then(setPendingImageBase64)
                .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"))
              e.target.value = ""
            }}
          />
          {pendingImageBase64 ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingImageBase64} alt="" className="h-16 w-24 rounded border object-cover" />
              <Button type="button" variant="outline" size="sm" onClick={() => setPendingImageBase64(null)}>
                Clear
              </Button>
            </div>
          ) : null}
        </div>
        <div className="space-y-1">
          <Label>Caption</Label>
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <LoadingButton
          type="button"
          loading={addingGallery}
          loadingText="Adding…"
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
                <span className="truncate text-muted-foreground">{img.caption ?? "—"}</span>
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
                Delete
              </LoadingButton>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
