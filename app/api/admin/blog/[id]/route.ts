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

const patchSchema = z.object({
  slug: z
    .string()
    .min(1)
    .transform(normalizeSlug)
    .refine((s) => s.length >= 2, { message: "Slug must be at least 2 characters" })
    .refine((s) => /^[a-z0-9-]+$/.test(s), { message: "Invalid slug characters" })
    .optional(),
  title: z.string().trim().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().trim().min(1).optional(),
  coverImageBase64: optionalStoredImageSchema,
  published: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireStaffApi()
    if (denied) {
      return denied
    }
    const { id } = await context.params
    const json = await request.json().catch(() => ({}))
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      const { message, issues } = formatZodIssues(parsed.error)
      return NextResponse.json({ message, issues }, { status: 400 })
    }
    const existing = await prisma.blogPost.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }
    const nextPublished =
      parsed.data.published !== undefined ? parsed.data.published : existing.published
    let publishedAt = existing.publishedAt
    if (nextPublished && !existing.publishedAt) {
      publishedAt = new Date()
    }
    if (!nextPublished) {
      publishedAt = null
    }
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.excerpt !== undefined ? { excerpt: parsed.data.excerpt } : {}),
        ...(parsed.data.content !== undefined ? { content: parsed.data.content } : {}),
        ...(parsed.data.coverImageBase64 !== undefined
          ? {
              coverImageBase64:
                parsed.data.coverImageBase64 === "" || parsed.data.coverImageBase64 == null
                  ? null
                  : parsed.data.coverImageBase64,
            }
          : {}),
        ...(parsed.data.published !== undefined ? { published: parsed.data.published } : {}),
        publishedAt,
      },
    })
    return NextResponse.json({ post })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { message: "That slug is already used.", issues: ["slug: unique"] },
        { status: 409 }
      )
    }
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireStaffApi()
    if (denied) {
      return denied
    }
    const { id } = await context.params
    await prisma.blogPost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}
