import { NextResponse } from "next/server"
import { z } from "zod"

import type { Prisma } from "@prisma/client"

import { requireStaffApi } from "@/lib/api/require-staff"
import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"

const postSchema = z.object({
  startsAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid start"),
  endsAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid end"),
  capacity: z.coerce.number().int().positive().max(50).optional(),
  label: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

const MAX_PICKER_SLOTS = 2000
const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 50

async function enrichSlots(
  slots: Array<{
    id: string
    startsAt: Date
    endsAt: Date
    capacity: number
    label: string | null
    isActive: boolean
  }>
) {
  if (slots.length === 0) {
    return []
  }
  const ids = slots.map((s) => s.id)
  const takenBySlot = await prisma.reservation.groupBy({
    by: ["slotId"],
    where: {
      slotId: { in: ids },
      status: { in: ["UPCOMING", "WAITING", "CURRENT"] },
    },
    _count: { id: true },
  })
  const takenMap = new Map(
    takenBySlot.filter((r) => r.slotId != null).map((r) => [r.slotId as string, r._count.id])
  )
  return slots.map((s) => {
    const taken = takenMap.get(s.id) ?? 0
    return {
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      capacity: s.capacity,
      label: s.label,
      isActive: s.isActive,
      taken,
      remaining: Math.max(0, s.capacity - taken),
    }
  })
}

export async function GET(request: Request) {
  const denied = await requireStaffApi()
  if (denied) {
    return denied
  }

  const url = new URL(request.url)
  const forPicker = url.searchParams.get("forPicker") === "1"

  if (forPicker) {
    const now = new Date()
    const slots = await prisma.bookingSlot.findMany({
      where: {
        isActive: true,
        endsAt: { gt: now },
      },
      orderBy: { startsAt: "asc" },
      take: MAX_PICKER_SLOTS,
    })
    const enriched = await enrichSlots(slots)
    return NextResponse.json({ slots: enriched })
  }

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1)
  const pageSizeRaw = parseInt(url.searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10)
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(10, pageSizeRaw || DEFAULT_PAGE_SIZE))
  const windowParam = (url.searchParams.get("window") || "upcoming").toLowerCase()
  const window =
    windowParam === "past" || windowParam === "all" ? windowParam : "upcoming"
  const q = url.searchParams.get("q")?.trim() ?? ""

  const now = new Date()
  const where: Prisma.BookingSlotWhereInput = {}
  if (window === "upcoming") {
    where.endsAt = { gt: now }
  } else if (window === "past") {
    where.endsAt = { lte: now }
  }
  if (q.length > 0) {
    where.label = { contains: q, mode: "insensitive" }
  }

  const orderBy: Prisma.BookingSlotOrderByWithRelationInput =
    window === "past" ? { startsAt: "desc" } : { startsAt: "asc" }

  const [total, rows] = await Promise.all([
    prisma.bookingSlot.count({ where }),
    prisma.bookingSlot.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const slots = await enrichSlots(rows)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return NextResponse.json({
    slots,
    total,
    page,
    pageSize,
    totalPages,
    window,
  })
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
      return NextResponse.json({ message: parsed.error.message }, { status: 400 })
    }
    const startsAt = new Date(parsed.data.startsAt)
    const endsAt = new Date(parsed.data.endsAt)
    if (endsAt <= startsAt) {
      return NextResponse.json({ message: "End time must be after start" }, { status: 400 })
    }
    const now = new Date()
    if (endsAt <= now) {
      return NextResponse.json(
        {
          message:
            "End time must be in the future (server UTC). /book only lists slots that have not ended yet.",
        },
        { status: 400 }
      )
    }
    const slot = await prisma.bookingSlot.create({
      data: {
        startsAt,
        endsAt,
        capacity: parsed.data.capacity ?? 1,
        label: parsed.data.label ?? null,
        isActive: parsed.data.isActive ?? true,
      },
    })
    return NextResponse.json({ slot }, { status: 201 })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed"
    return NextResponse.json({ message }, { status: 500 })
  }
}
