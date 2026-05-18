import { NextResponse } from "next/server"

import { localizeBlogPost } from "@/lib/localized-content"
import { getServerLocale } from "@/lib/server/locale"
import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const locale = await getServerLocale()
  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")

  if (slug) {
    const post = await prisma.blogPost.findFirst({
      where: { slug, published: true },
    })
    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }
    const localized = localizeBlogPost(post, locale)
    return NextResponse.json({
      post: {
        title: localized.title,
        content: localized.content,
        coverImageBase64: post.coverImageBase64,
        publishedAt: post.publishedAt?.toISOString() ?? null,
      },
    })
  }

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: {
      id: true,
      slug: true,
      title: true,
      titleAr: true,
      excerpt: true,
      excerptAr: true,
      content: true,
      contentAr: true,
      coverImageBase64: true,
      publishedAt: true,
      createdAt: true,
    },
  })
  return NextResponse.json({
    posts: posts.map((post) => {
      const localized = localizeBlogPost(post, locale)
      return {
        id: post.id,
        slug: post.slug,
        title: localized.title,
        excerpt: localized.excerpt,
        coverImageBase64: post.coverImageBase64,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
      }
    }),
  })
}
