import { NextResponse } from "next/server"

import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const slug = url.searchParams.get("slug")

  if (slug) {
    const post = await prisma.blogPost.findFirst({
      where: { slug, published: true },
    })
    if (!post) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }
    return NextResponse.json({
      post: {
        title: post.title,
        content: post.content,
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
      excerpt: true,
      coverImageBase64: true,
      publishedAt: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ posts })
}
