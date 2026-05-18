import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApi } from "@/lib/api/require-staff"
import { prisma } from "@/lib/server/db"
import { requiredStoredImageSchema } from "@/lib/validation/stored-image"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  imageBase64: requiredStoredImageSchema.optional(),
  caption: z.string().nullable().optional(),
  captionAr: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
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
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
    }
    const p = parsed.data
    const image = await prisma.galleryImage.update({
      where: { id },
      data: {
        ...(p.caption !== undefined ? { caption: p.caption } : {}),
        ...(p.captionAr !== undefined ? { captionAr: p.captionAr } : {}),
        ...(p.sortOrder !== undefined ? { sortOrder: p.sortOrder } : {}),
        ...(p.imageBase64 !== undefined ? { imageBase64: p.imageBase64 } : {}),
      },
    })
    return NextResponse.json({ image })
  } catch (e) {
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
    await prisma.galleryImage.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}
