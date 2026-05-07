import { NextResponse } from "next/server"

import { prisma } from "@/lib/server/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const MAX_SLOTS = 800

/**
 * Every **active** slot whose **end** is still in the future (server time).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const diagnose =
    process.env.NODE_ENV === "development" && url.searchParams.get("diagnose") === "1"

  const now = new Date()

  let _diagnose: Record<string, unknown> | undefined

  if (diagnose) {
    const [total, activeTrue, activeAndEndAfterNow] = await Promise.all([
      prisma.bookingSlot.count(),
      prisma.bookingSlot.count({ where: { isActive: true } }),
      prisma.bookingSlot.count({ where: { isActive: true, endsAt: { gt: now } } }),
    ])
    const recentRows = await prisma.bookingSlot.findMany({
      take: 12,
      orderBy: { startsAt: "desc" },
      select: { id: true, startsAt: true, endsAt: true, isActive: true },
    })
    _diagnose = {
      serverNowISO: now.toISOString(),
      counts: {
        totalRowsInBookingSlotTable: total,
        whereIsActiveTrue: activeTrue,
        whereIsActiveTrueAndEndsAtAfterNow: activeAndEndAfterNow,
      },
      whyPublicSlotsMightBeEmpty:
        activeTrue === 0
          ? "No rows have isActive=true in the database THIS SERVER is connected to."
          : activeAndEndAfterNow === 0
            ? "Active rows exist but every endsAt is on or before server time — extend End into the future."
            : "Rows should appear below; if slots is still empty, check for errors above.",
      recentRows: recentRows.map((s) => ({
        id: s.id,
        isActive: s.isActive,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        endsAfterServerNow: s.endsAt.getTime() > now.getTime(),
      })),
    }
  }

  const slots = await prisma.bookingSlot.findMany({
    where: {
      isActive: true,
      endsAt: { gt: now },
    },
    orderBy: { startsAt: "asc" },
    take: MAX_SLOTS,
  })

  const result = await Promise.all(
    slots.map(async (s) => {
      const taken = await prisma.reservation.count({
        where: {
          slotId: s.id,
          status: { in: ["UPCOMING", "WAITING", "CURRENT"] },
        },
      })
      const remaining = Math.max(0, s.capacity - taken)
      return {
        id: s.id,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        label: s.label,
        capacity: s.capacity,
        remaining,
      }
    })
  )

  return NextResponse.json(
    { slots: result, ...(_diagnose ? { _diagnose } : {}) },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  )
}
