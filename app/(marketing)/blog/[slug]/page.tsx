"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

type Post = {
  title: string
  content: string
  coverImageBase64: string | null
  publishedAt: string | null
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = typeof params.slug === "string" ? params.slug : ""
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    void fetch(`/api/public/blog?slug=${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (!r.ok) {
          setError("Post not found")
          return
        }
        const d = (await r.json()) as { post: Post }
        setPost(d.post)
      })
      .catch(() => setError("Failed to load"))
  }, [slug])

  if (error) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-16 text-center">
        <p className="text-slate-600 dark:text-slate-400">{error}</p>
        <Link href="/blog" className="mt-4 inline-block text-sm text-teal-700 underline dark:text-teal-400">
          Back to blog
        </Link>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 px-4 py-16">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/blog"
        className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Blog
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
        {post.title}
      </h1>
      {post.coverImageBase64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageBase64}
          alt=""
          className="mt-8 w-full rounded-2xl border border-slate-200/80 object-cover dark:border-slate-800"
        />
      ) : null}
      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-p:leading-relaxed">
        {post.content.split("\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  )
}
