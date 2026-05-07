"use client"

import { useEffect, useState } from "react"

import { useSiteContent } from "@/components/marketing/site-content-context"
import { Skeleton } from "@/components/ui/skeleton"

type Img = { id: string; imageBase64: string; caption: string | null }

export default function GalleryPage() {
  const site = useSiteContent()
  const [images, setImages] = useState<Img[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch("/api/public/gallery")
      .then((r) => r.json())
      .then((d) => setImages(d.images ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {site.galleryPageTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {site.galleryPageSubtitle}
        </p>
      </div>

      {loading ? (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="mb-4 break-inside-avoid aspect-[4/3] w-full rounded-2xl" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <p className="text-sm text-slate-600 dark:text-slate-400">{site.galleryEmptyMessage}</p>
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {images.map((img) => (
            <figure
              key={img.id}
              className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageBase64} alt={img.caption ?? ""} className="w-full object-cover" />
              {img.caption ? (
                <figcaption className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                  {img.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}
