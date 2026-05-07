import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApi } from "@/lib/api/require-staff"
import { prisma } from "@/lib/server/db"
import { optionalStoredImageSchema } from "@/lib/validation/stored-image"

export const dynamic = "force-dynamic"

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  priceLabel: z.string().nullable().optional(),
  imageBase64: optionalStoredImageSchema,
  sortOrder: z.coerce.number().int().optional(),
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
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
    }
    const p = parsed.data
    const item = await prisma.serviceItem.update({
      where: { id },
      data: {
        ...(p.title !== undefined ? { title: p.title } : {}),
        ...(p.description !== undefined ? { description: p.description } : {}),
        ...(p.priceLabel !== undefined ? { priceLabel: p.priceLabel } : {}),
        ...(p.sortOrder !== undefined ? { sortOrder: p.sortOrder } : {}),
        ...(p.published !== undefined ? { published: p.published } : {}),
        ...(p.imageBase64 !== undefined
          ? { imageBase64: p.imageBase64 === "" ? null : p.imageBase64 }
          : {}),
      },
    })
    return NextResponse.json({ item })
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
    await prisma.serviceItem.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}
