import { prisma } from "@/lib/server/db"

export type PatientBillingSummary = {
  totalChargedCents: number
  totalPaidCents: number
  balanceDueCents: number
}

type Totals = { charged: number; paid: number }

function addTotals(map: Map<string, Totals>, patientId: string, charge: number, payment: number) {
  if (!patientId) return
  const row = map.get(patientId) ?? { charged: 0, paid: 0 }
  row.charged += Math.max(0, charge)
  row.paid += Math.max(0, payment)
  map.set(patientId, row)
}

async function aggregateFromLedger(patientIds: string[]): Promise<Map<string, Totals>> {
  const map = new Map<string, Totals>()
  if (patientIds.length === 0) return map

  try {
    const entries = await prisma.patientLedgerEntry.findMany({
      where: { patientId: { in: patientIds } },
      select: { patientId: true, type: true, amountCents: true },
    })
    for (const entry of entries) {
      if (entry.type === "CHARGE") {
        addTotals(map, entry.patientId, entry.amountCents, 0)
      } else if (entry.type === "PAYMENT") {
        addTotals(map, entry.patientId, 0, entry.amountCents)
      }
    }
  } catch {
    // Table missing or client out of date — fall back to reservations only
  }

  return map
}

async function aggregateFromReservations(patientIds: string[]): Promise<Map<string, Totals>> {
  const map = new Map<string, Totals>()
  if (patientIds.length === 0) return map

  try {
    const rows = await prisma.reservation.findMany({
      where: {
        patientId: { in: patientIds },
        status: "COMPLETED",
      },
      select: {
        patientId: true,
        chargeCents: true,
        feeCents: true,
        paymentCents: true,
      },
    })

    for (const row of rows) {
      const charge = row.chargeCents ?? row.feeCents ?? 0
      const payment = row.paymentCents ?? 0
      addTotals(map, row.patientId, charge, payment)
    }
  } catch {
    // Ignore if billing columns are missing on Reservation
  }

  return map
}

function mergeTotals(ledger: Map<string, Totals>, reservations: Map<string, Totals>): Map<string, Totals> {
  const merged = new Map<string, Totals>()

  for (const [id, t] of ledger) {
    merged.set(id, { ...t })
  }

  for (const [id, res] of reservations) {
    const existing = merged.get(id)
    if (!existing || (existing.charged === 0 && existing.paid === 0)) {
      merged.set(id, { ...res })
    } else if (res.charged > existing.charged || res.paid > existing.paid) {
      // Ledger is source of truth; if reservation totals are higher (legacy data), use max
      merged.set(id, {
        charged: Math.max(existing.charged, res.charged),
        paid: Math.max(existing.paid, res.paid),
      })
    }
  }

  return merged
}

/**
 * Lifetime billing totals: ledger entries when present, else completed visits on Reservation.
 * Remaining is derived from those totals so it stays consistent with charged/paid in the UI.
 */
export async function getBillingSummariesForPatients(
  patientIds: string[],
  profileBalanceById: Map<string, number> = new Map()
): Promise<Map<string, PatientBillingSummary>> {
  const uniqueIds = [...new Set(patientIds.filter(Boolean))]
  const result = new Map<string, PatientBillingSummary>()

  if (uniqueIds.length === 0) return result

  const [ledgerTotals, reservationTotals] = await Promise.all([
    aggregateFromLedger(uniqueIds),
    aggregateFromReservations(uniqueIds),
  ])

  const merged = mergeTotals(ledgerTotals, reservationTotals)

  for (const id of uniqueIds) {
    const totals = merged.get(id)
    const charged = totals?.charged ?? 0
    const paid = totals?.paid ?? 0
    const computedRemaining = Math.max(0, charged - paid)
    const profileBalance = profileBalanceById.has(id)
      ? profileBalanceById.get(id)!
      : undefined
    const remaining =
      profileBalance !== undefined &&
      profileBalance > 0 &&
      profileBalance !== computedRemaining
        ? profileBalance
        : computedRemaining

    result.set(id, {
      totalChargedCents: charged,
      totalPaidCents: paid,
      balanceDueCents: remaining,
    })
  }

  return result
}

export function mergeBillingIntoProfile<T extends { balanceDueCents?: number }>(
  profile: T,
  summary: PatientBillingSummary | undefined
): T & PatientBillingSummary {
  if (!summary) {
    const balance = profile.balanceDueCents ?? 0
    return {
      ...profile,
      totalChargedCents: 0,
      totalPaidCents: 0,
      balanceDueCents: balance,
    }
  }
  return { ...profile, ...summary }
}
