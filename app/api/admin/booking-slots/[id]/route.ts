import { NextResponse } from "next/server"
import { z } from "zod"

import { requireStaffApi } from "@/lib/api/require-staff"
import {
  CLINIC_HOURS_MESSAGE,
  isWithinClinicHours,
} from "@/lib/scheduling/clinic-hours"
import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"
const CLINIC_TIME_ZONE = process.env.CLINIC_TIME_ZONE || "Asia/Damascus"

const patchSchema = z.object({
  startsAt: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid start")
    .optional(),
  endsAt: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid end")
    .optional(),
  capacity: z.coerce.number().int().positive().max(50).optional(),
  label: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
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
    if (parsed.data.startsAt || parsed.data.endsAt || parsed.data.isActive === true) {
      const existing = await prisma.bookingSlot.findUnique({
        where: { id },
        select: { startsAt: true, endsAt: true },
      })
      if (!existing) {
        return NextResponse.json({ message: "Slot not found" }, { status: 404 })
      }
      const nextStart = parsed.data.startsAt
        ? new Date(parsed.data.startsAt)
        : existing.startsAt
      const nextEnd = parsed.data.endsAt ? new Date(parsed.data.endsAt) : existing.endsAt
      if (nextEnd <= nextStart) {
        return NextResponse.json({ message: "End time must be after start" }, { status: 400 })
      }
      if (!isWithinClinicHours(nextStart, nextEnd, CLINIC_TIME_ZONE)) {
        return NextResponse.json({ message: CLINIC_HOURS_MESSAGE }, { status: 400 })
      }
    }
    const data: Record<string, unknown> = {}
    if (parsed.data.startsAt) {
      data.startsAt = new Date(parsed.data.startsAt)
    }
    if (parsed.data.endsAt) {
      data.endsAt = new Date(parsed.data.endsAt)
    }
    if (parsed.data.capacity !== undefined) {
      data.capacity = parsed.data.capacity
    }
    if (parsed.data.label !== undefined) {
      data.label = parsed.data.label
    }
    if (parsed.data.isActive !== undefined) {
      data.isActive = parsed.data.isActive
    }
    const slot = await prisma.bookingSlot.update({
      where: { id },
      data: data as never,
    })
    return NextResponse.json({ slot })
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
    await prisma.bookingSlot.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 400 })
  }
}
