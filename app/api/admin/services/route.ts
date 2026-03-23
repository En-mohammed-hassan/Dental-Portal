import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApi } from "@/lib/api/require-staff"
import { prisma } from "@/lib/server/db"
import { optionalStoredImageSchema } from "@/lib/validation/stored-image"

export const dynamic = "force-dynamic"

const postSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  priceLabel: z.string().nullable().optional(),
  imageBase64: optionalStoredImageSchema,
  sortOrder: z.coerce.number().int().optional(),
  published: z.boolean().optional(),
})

export async function GET() {
  const denied = await requireStaffApi()
  if (denied) {
    return denied
  }
  const items = await prisma.serviceItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ items })
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
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
    }
    const item = await prisma.serviceItem.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        priceLabel: parsed.data.priceLabel ?? null,
        imageBase64:
          parsed.data.imageBase64 === ""
            ? null
            : (parsed.data.imageBase64 ?? null),
        sortOrder: parsed.data.sortOrder ?? 0,
        published: parsed.data.published ?? true,
      },
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 500 })
  }
}
