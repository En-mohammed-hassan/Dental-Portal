import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApi } from "@/lib/api/require-staff"
import { prisma } from "@/lib/server/db"
import { requiredStoredImageSchema } from "@/lib/validation/stored-image"

export const dynamic = "force-dynamic"

const postSchema = z.object({
  imageBase64: requiredStoredImageSchema,
  caption: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
})

export async function GET() {
  const denied = await requireStaffApi()
  if (denied) {
    return denied
  }
  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ images })
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
    const image = await prisma.galleryImage.create({
      data: {
        imageBase64: parsed.data.imageBase64,
        caption: parsed.data.caption ?? null,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    })
    return NextResponse.json({ image }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 500 })
  }
}
