import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApi } from "@/lib/api/require-staff"
import { prisma } from "@/lib/server/db"
import { formatZodIssues } from "@/lib/zod-errors"
import { optionalStoredImageSchema } from "@/lib/validation/stored-image"

export const dynamic = "force-dynamic"

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

const postSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .transform(normalizeSlug)
    .refine((s) => s.length >= 2, { message: "Slug must be at least 2 characters (letters, numbers, hyphens)" })
    .refine((s) => /^[a-z0-9-]+$/.test(s), { message: "Slug can only use lowercase letters, numbers, and hyphens" }),
  title: z.string().trim().min(1, "Title is required"),
  titleAr: z.string().nullable().optional(),
  excerpt: z.string().nullable().optional(),
  excerptAr: z.string().nullable().optional(),
  content: z.string().trim().min(1, "Content is required"),
  contentAr: z.string().nullable().optional(),
  coverImageBase64: optionalStoredImageSchema,
  published: z.boolean().optional(),
})

export async function GET() {
  const denied = await requireStaffApi()
  if (denied) {
    return denied
  }
  const posts = await prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
  })
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  try {
    const denied = await requireStaffApi()
    if (denied) {
      return denied
    }
    const json = await request.json().catch(() => ({}))
    const parsed = postSchema.safeParse(json)
    if (!parsed.success) {
      const { message, issues } = formatZodIssues(parsed.error)
      return NextResponse.json({ message, issues }, { status: 400 })
    }
    const published = parsed.data.published ?? false
    const post = await prisma.blogPost.create({
      data: {
        slug: parsed.data.slug,
        title: parsed.data.title,
        titleAr: parsed.data.titleAr ?? null,
        excerpt: parsed.data.excerpt ?? null,
        excerptAr: parsed.data.excerptAr ?? null,
        content: parsed.data.content,
        contentAr: parsed.data.contentAr ?? null,
        coverImageBase64:
          parsed.data.coverImageBase64 === ""
            ? null
            : (parsed.data.coverImageBase64 ?? null),
        published,
        publishedAt: published ? new Date() : null,
      },
    })
    return NextResponse.json({ post }, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { message: "That slug is already used. Pick another slug.", issues: ["slug: unique"] },
        { status: 409 }
      )
    }
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 500 })
  }
}
