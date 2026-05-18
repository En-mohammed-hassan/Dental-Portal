import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns"

import { prisma } from "@/lib/server/db"
import { getBillingSummariesForPatients } from "@/lib/server/patient-billing-summary"

export type StatsPeriod = "week" | "month" | "year"

export type StatsTimeSeriesPoint = {
  /** Start of bucket (ISO) — formatted on the client */
  date: string
  patients: number
  completed: number
  chargedCents: number
  paidCents: number
}

export type AdminStatsPayload = {
  period: StatsPeriod
  range: { from: string; to: string }
  patientsAdded: number
  reservationsCreated: number
  reservationsCompleted: number
  totalChargedCents: number
  totalPaidCents: number
  outstandingBalanceCents: number
  patientsWithBalance: number
  avgChargePerVisitCents: number
  totalCanalsTreated: number
  activeNow: {
    current: number
    waiting: number
    upcoming: number
  }
  byBookingType: {
    advance: number
    walkIn: number
    emergency: number
  }
  completedByPaymentStatus: {
    unpaid: number
    partial: number
    paid: number
    unset: number
  }
  series: StatsTimeSeriesPoint[]
}

function getDateRange(period: StatsPeriod): { from: Date; to: Date } {
  const now = new Date()
  const to = endOfDay(now)
  switch (period) {
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to }
    case "month":
      return { from: startOfMonth(now), to }
    case "year":
      return { from: startOfYear(now), to }
  }
}

/** Period billing from completed visits (matches history / finish-treatment data). */
async function sumFinancialsInRange(from: Date, to: Date): Promise<{ charged: number; paid: number }> {
  const completed = await prisma.reservation.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: from, lte: to },
    },
    select: { chargeCents: true, feeCents: true, paymentCents: true },
  })

  let charged = 0
  let paid = 0
  for (const row of completed) {
    charged += Math.max(0, row.chargeCents ?? row.feeCents ?? 0)
    paid += Math.max(0, row.paymentCents ?? 0)
  }

  if (charged > 0 || paid > 0) {
    return { charged, paid }
  }

  // Fallback: ledger-only data (e.g. legacy rows before chargeCents on Reservation)
  try {
    const [ledgerCharges, ledgerPayments] = await Promise.all([
      prisma.patientLedgerEntry.aggregate({
        where: { type: "CHARGE", createdAt: { gte: from, lte: to } },
        _sum: { amountCents: true },
      }),
      prisma.patientLedgerEntry.aggregate({
        where: { type: "PAYMENT", createdAt: { gte: from, lte: to } },
        _sum: { amountCents: true },
      }),
    ])
    return {
      charged: ledgerCharges._sum.amountCents ?? 0,
      paid: ledgerPayments._sum.amountCents ?? 0,
    }
  } catch {
    return { charged, paid }
  }
}

/** Clinic-wide remaining balance (charged − paid per patient), same logic as patient cards. */
async function getClinicOutstanding(): Promise<{
  outstandingBalanceCents: number
  patientsWithBalance: number
}> {
  const patients = await prisma.patientProfile.findMany({
    select: { id: true, balanceDueCents: true },
  })

  if (patients.length === 0) {
    return { outstandingBalanceCents: 0, patientsWithBalance: 0 }
  }

  const summaries = await getBillingSummariesForPatients(
    patients.map((p) => p.id),
    new Map(patients.map((p) => [p.id, p.balanceDueCents ?? 0]))
  )

  let outstandingBalanceCents = 0
  let patientsWithBalance = 0
  for (const summary of summaries.values()) {
    outstandingBalanceCents += summary.balanceDueCents
    if (summary.balanceDueCents > 0) patientsWithBalance++
  }

  return { outstandingBalanceCents, patientsWithBalance }
}

type TimeBucket = { start: Date; end: Date }

function buildTimeBuckets(period: StatsPeriod, from: Date, to: Date): TimeBucket[] {
  if (period === "year") {
    return eachMonthOfInterval({ start: from, end: to }).map((monthStart) => ({
      start: startOfMonth(monthStart),
      end: endOfMonth(monthStart),
    }))
  }
  return eachDayOfInterval({ start: from, end: to }).map((day) => ({
    start: startOfDay(day),
    end: endOfDay(day),
  }))
}

function inBucket(date: Date, bucket: TimeBucket): boolean {
  return date >= bucket.start && date <= bucket.end
}

async function buildTimeSeries(
  period: StatsPeriod,
  from: Date,
  to: Date
): Promise<StatsTimeSeriesPoint[]> {
  const buckets = buildTimeBuckets(period, from, to)

  const [patients, completed] = await Promise.all([
    prisma.patientProfile.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    }),
    prisma.reservation.findMany({
      where: { status: "COMPLETED", completedAt: { gte: from, lte: to } },
      select: {
        completedAt: true,
        chargeCents: true,
        feeCents: true,
        paymentCents: true,
      },
    }),
  ])

  return buckets.map((bucket) => {
    let patientsCount = 0
    let completedCount = 0
    let chargedCents = 0
    let paidCents = 0

    for (const p of patients) {
      if (inBucket(p.createdAt, bucket)) patientsCount++
    }

    for (const r of completed) {
      if (!r.completedAt || !inBucket(r.completedAt, bucket)) continue
      completedCount++
      chargedCents += Math.max(0, r.chargeCents ?? r.feeCents ?? 0)
      paidCents += Math.max(0, r.paymentCents ?? 0)
    }

    return {
      date: bucket.start.toISOString(),
      patients: patientsCount,
      completed: completedCount,
      chargedCents,
      paidCents,
    }
  })
}

export async function getAdminStats(period: StatsPeriod): Promise<AdminStatsPayload> {
  const { from, to } = getDateRange(period)
  const createdAtRange = { gte: from, lte: to }
  const completedAtRange = { gte: from, lte: to }

  const [
    patientsAdded,
    reservationsCreated,
    reservationsCompleted,
    ledgerTotals,
    clinicOutstanding,
    activeGroups,
    bookingGroups,
    paymentGroups,
    canalsAgg,
    chargeSamples,
    series,
  ] = await Promise.all([
    prisma.patientProfile.count({ where: { createdAt: createdAtRange } }),
    prisma.reservation.count({ where: { createdAt: createdAtRange } }),
    prisma.reservation.count({
      where: { status: "COMPLETED", completedAt: completedAtRange },
    }),
    sumFinancialsInRange(from, to),
    getClinicOutstanding(),
    prisma.reservation.groupBy({
      by: ["status"],
      where: { status: { in: ["CURRENT", "WAITING", "UPCOMING"] } },
      _count: { _all: true },
    }),
    prisma.reservation.groupBy({
      by: ["bookingType"],
      where: { createdAt: createdAtRange },
      _count: { _all: true },
    }),
    prisma.reservation.groupBy({
      by: ["paymentStatus"],
      where: { status: "COMPLETED", completedAt: completedAtRange },
      _count: { _all: true },
    }),
    prisma.reservation.aggregate({
      where: {
        status: "COMPLETED",
        completedAt: completedAtRange,
        canalsCount: { not: null },
      },
      _sum: { canalsCount: true },
    }),
    prisma.reservation.findMany({
      where: {
        status: "COMPLETED",
        completedAt: completedAtRange,
        OR: [{ chargeCents: { gt: 0 } }, { feeCents: { gt: 0 } }],
      },
      select: { chargeCents: true, feeCents: true },
    }),
    buildTimeSeries(period, from, to),
  ])

  const activeNow = { current: 0, waiting: 0, upcoming: 0 }
  for (const row of activeGroups) {
    if (row.status === "CURRENT") activeNow.current = row._count._all
    if (row.status === "WAITING") activeNow.waiting = row._count._all
    if (row.status === "UPCOMING") activeNow.upcoming = row._count._all
  }

  const byBookingType = { advance: 0, walkIn: 0, emergency: 0 }
  for (const row of bookingGroups) {
    if (row.bookingType === "ADVANCE") byBookingType.advance = row._count._all
    if (row.bookingType === "WALK_IN") byBookingType.walkIn = row._count._all
    if (row.bookingType === "EMERGENCY") byBookingType.emergency = row._count._all
  }

  const completedByPaymentStatus = { unpaid: 0, partial: 0, paid: 0, unset: 0 }
  for (const row of paymentGroups) {
    if (row.paymentStatus === "UNPAID") completedByPaymentStatus.unpaid = row._count._all
    else if (row.paymentStatus === "PARTIAL") completedByPaymentStatus.partial = row._count._all
    else if (row.paymentStatus === "PAID") completedByPaymentStatus.paid = row._count._all
    else completedByPaymentStatus.unset = row._count._all
  }

  const visitCharges = chargeSamples.map((r) => Math.max(0, r.chargeCents ?? r.feeCents ?? 0))
  const avgChargePerVisitCents =
    visitCharges.length > 0
      ? Math.round(visitCharges.reduce((a, b) => a + b, 0) / visitCharges.length)
      : 0

  return {
    period,
    range: { from: from.toISOString(), to: to.toISOString() },
    patientsAdded,
    reservationsCreated,
    reservationsCompleted,
    totalChargedCents: ledgerTotals.charged,
    totalPaidCents: ledgerTotals.paid,
    outstandingBalanceCents: clinicOutstanding.outstandingBalanceCents,
    patientsWithBalance: clinicOutstanding.patientsWithBalance,
    avgChargePerVisitCents,
    totalCanalsTreated: canalsAgg._sum.canalsCount ?? 0,
    activeNow,
    byBookingType,
    completedByPaymentStatus,
    series,
  }
}
