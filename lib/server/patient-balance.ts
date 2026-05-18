import type { Prisma } from "@prisma/client"

import { clampCents } from "@/lib/money"

type FinishBalanceInput = {
  patientId: string
  reservationId: string
  chargeCents?: number | null
  paymentCents?: number | null
  /** Legacy: fee field treated as charge when charge omitted */
  feeCents?: number | null
  note?: string | null
}

/**
 * Apply session charge/payment to patient running balance and write ledger rows.
 */
export async function applyPatientBalanceOnFinish(
  tx: Prisma.TransactionClient,
  input: FinishBalanceInput
): Promise<{
  balanceDueCents: number
  chargeCents: number
  paymentCents: number
}> {
  const charge = clampCents(input.chargeCents ?? input.feeCents ?? 0)
  const payment = clampCents(input.paymentCents ?? 0)

  const patient = await tx.patientProfile.findUniqueOrThrow({
    where: { id: input.patientId },
    select: { balanceDueCents: true },
  })

  let running = patient.balanceDueCents

  if (charge > 0) {
    running += charge
    await tx.patientLedgerEntry.create({
      data: {
        patientId: input.patientId,
        reservationId: input.reservationId,
        type: "CHARGE",
        amountCents: charge,
        balanceAfterCents: running,
        note: input.note?.trim() || null,
      },
    })
  }

  if (payment > 0) {
    running = Math.max(0, running - payment)
    await tx.patientLedgerEntry.create({
      data: {
        patientId: input.patientId,
        reservationId: input.reservationId,
        type: "PAYMENT",
        amountCents: payment,
        balanceAfterCents: running,
        note: input.note?.trim() || null,
      },
    })
  }

  await tx.patientProfile.update({
    where: { id: input.patientId },
    data: { balanceDueCents: running },
  })

  return {
    balanceDueCents: running,
    chargeCents: charge,
    paymentCents: payment,
  }
}
