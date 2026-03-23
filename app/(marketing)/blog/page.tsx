"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { useSiteContent } from "@/components/marketing/site-content-context"
import { Skeleton } from "@/components/ui/skeleton"

type Post = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImageBase64: string | null
  publishedAt: string | null
}

export default function BlogListPage() {
  const site = useSiteContent()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetch("/api/public/blog")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {site.blogPageTitle}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {site.blogPageSubtitle}
        </p>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800"
              >
                <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                  <Skeleton className="aspect-[4/3] min-h-[140px] w-full sm:aspect-auto" />
                  <div className="space-y-3 p-5">
                    <Skeleton className="h-6 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300/80 bg-white/50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/30">
            <p className="text-sm text-slate-600 dark:text-slate-400">{site.blogEmptyMessage}</p>
          </div>
        ) : (
          posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm transition hover:border-teal-300/80 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-teal-700/50"
            >
              <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                <div className="aspect-[4/3] bg-slate-100 sm:aspect-auto sm:min-h-[140px] dark:bg-slate-800">
                  {p.coverImageBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImageBase64} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-slate-900 group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-400">
                    {p.title}
                  </h2>
                  {p.excerpt ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {p.excerpt}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
