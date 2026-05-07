"use client"

import { useEffect, useState } from "react"

import { useSiteContent } from "@/components/marketing/site-content-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type Item = {
  id: string
  title: string
  description: string
  priceLabel: string | null
  imageBase64: string | null
}

export default function ServicesPage() {
  const site = useSiteContent()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch("/api/public/services")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {site.servicesPageTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {site.servicesPageSubtitle}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-slate-200/80 dark:border-slate-800">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <p className="text-sm text-slate-600 dark:text-slate-400">{site.servicesEmptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden border-slate-200/80 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50"
            >
              {item.imageBase64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageBase64}
                  alt=""
                  className="h-44 w-full object-cover"
                />
              ) : null}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                {item.priceLabel ? (
                  <CardDescription className="text-base font-semibold text-teal-700 dark:text-teal-400">
                    {item.priceLabel}
                  </CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
