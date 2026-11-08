import { z } from "zod"

import { prisma } from "@/lib/server/db"

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid reminder date")

function dateOnlyToUtc(value: string): Date {
  const parsed = dateOnlySchema.parse(value)
  const date = new Date(`${parsed}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== parsed) {
    throw new Error("Invalid reminder date")
  }
  return date
}

function mapReminder(row: {
  id: string
  patientId: string
  dueOn: Date
  status: string
  note: string | null
  reservationId: string | null
  createdAt: Date
  resolvedAt: Date | null
  patient: { name: string; phone: string | null }
}) {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patient.name,
    patientPhone: row.patient.phone,
    dueOn: row.dueOn.toISOString().slice(0, 10),
    status: row.status.toLowerCase(),
    note: row.note,
    reservationId: row.reservationId,
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  }
}

export async function listReminders(selectedDate: string) {
  const date = dateOnlyToUtc(selectedDate)
  const rows = await prisma.patientReminder.findMany({
    where: { status: "PENDING" },
    orderBy: [{ dueOn: "asc" }, { createdAt: "asc" }],
    take: 500,
    include: { patient: { select: { name: true, phone: true } } },
  })

  const mapped = rows.map(mapReminder)
  const selectedKey = date.toISOString().slice(0, 10)
  return {
    overdue: mapped.filter((row) => row.dueOn < selectedKey),
    due: mapped.filter((row) => row.dueOn === selectedKey),
    upcoming: mapped.filter((row) => row.dueOn > selectedKey),
  }
}

const laserDaySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  reminderDueOn: dateOnlySchema,
})

function parseLaserDayRange(payload: unknown) {
  const parsed = laserDaySchema.safeParse(payload)
  if (!parsed.success) throw new Error("Invalid laser patient date range")

  const from = new Date(parsed.data.from)
  const to = new Date(parsed.data.to)
  const rangeMs = to.getTime() - from.getTime()
  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(to.getTime()) ||
    rangeMs <= 0 ||
    rangeMs > 26 * 60 * 60 * 1000
  ) {
    throw new Error("Invalid laser patient date range")
  }

  return {
    from,
    to,
    reminderDueOn: dateOnlyToUtc(parsed.data.reminderDueOn),
  }
}

export async function listLaserPatientsForDay(payload: unknown) {
  const { from, to, reminderDueOn } = parseLaserDayRange(payload)
  const rows = await prisma.reservation.findMany({
    where: {
      appointmentDate: { gte: from, lt: to },
      serviceType: "LASER",
    },
    orderBy: [{ appointmentDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      patientId: true,
      appointmentDate: true,
      endsAt: true,
      status: true,
      reminder: {
        select: { id: true, dueOn: true, status: true },
      },
      patient: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  })

  const patients = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    const current = patients.get(row.patientId)
    const rowHasReminder =
      row.reminder?.status === "PENDING" &&
      row.reminder.dueOn.getTime() === reminderDueOn.getTime()
    const currentHasReminder =
      current?.reminder?.status === "PENDING" &&
      current.reminder.dueOn.getTime() === reminderDueOn.getTime()
    if (!current || (!currentHasReminder && rowHasReminder)) {
      patients.set(row.patientId, row)
    }
  }

  return [...patients.values()].map((row) => ({
    reservationId: row.id,
    patientId: row.patientId,
    patientName: row.patient.name,
    patientPhone: row.patient.phone,
    startsAt: row.appointmentDate.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status.toLowerCase(),
    reminderId:
      row.reminder?.status === "PENDING" &&
      row.reminder.dueOn.getTime() === reminderDueOn.getTime()
        ? row.reminder.id
        : null,
  }))
}

const syncLaserRemindersSchema = laserDaySchema.extend({
  patientIds: z.array(z.string().min(1)).max(500),
})

export async function syncLaserPatientReminders(payload: unknown) {
  const parsed = syncLaserRemindersSchema.safeParse(payload)
  if (!parsed.success) throw new Error("Invalid laser reminder selection")

  const { from, to, reminderDueOn } = parseLaserDayRange(parsed.data)
  const rows = await prisma.reservation.findMany({
    where: {
      appointmentDate: { gte: from, lt: to },
      serviceType: "LASER",
    },
    orderBy: [{ appointmentDate: "asc" }, { createdAt: "asc" }],
    select: { id: true, patientId: true },
  })

  const reservationsByPatient = new Map<string, string[]>()
  for (const row of rows) {
    const current = reservationsByPatient.get(row.patientId) ?? []
    current.push(row.id)
    reservationsByPatient.set(row.patientId, current)
  }

  const selectedPatientIds = [...new Set(parsed.data.patientIds)]
  if (selectedPatientIds.some((patientId) => !reservationsByPatient.has(patientId))) {
    throw new Error("One or more selected patients do not have a laser reservation today")
  }

  const allPatientIds = [...reservationsByPatient.keys()]
  const selectedSet = new Set(selectedPatientIds)
  const unselectedPatientIds = allPatientIds.filter((patientId) => !selectedSet.has(patientId))
  const unselectedReservationIds = unselectedPatientIds.flatMap(
    (patientId) => reservationsByPatient.get(patientId) ?? []
  )

  await prisma.$transaction(async (tx) => {
    if (unselectedReservationIds.length) {
      await tx.patientReminder.deleteMany({
        where: {
          reservationId: { in: unselectedReservationIds },
          dueOn: reminderDueOn,
          status: "PENDING",
        },
      })
    }

    for (const patientId of selectedPatientIds) {
      const reservationId = reservationsByPatient.get(patientId)?.[0]
      if (!reservationId) continue

      const direct = await tx.patientReminder.findUnique({
        where: { reservationId },
      })
      if (direct) {
        await tx.patientReminder.update({
          where: { id: direct.id },
          data: { patientId, dueOn: reminderDueOn, status: "PENDING", resolvedAt: null },
        })
        await tx.patientReminder.deleteMany({
          where: {
            id: { not: direct.id },
            patientId,
            dueOn: reminderDueOn,
            status: "PENDING",
          },
        })
        continue
      }

      const existing = await tx.patientReminder.findFirst({
        where: { patientId, dueOn: reminderDueOn, status: "PENDING" },
        orderBy: { createdAt: "asc" },
      })
      if (existing) {
        await tx.patientReminder.update({
          where: { id: existing.id },
          data: { reservationId },
        })
        continue
      }

      await tx.patientReminder.create({
        data: {
          patientId,
          dueOn: reminderDueOn,
          reservationId,
        },
      })
    }
  })
}

const createReminderSchema = z.object({
  patientId: z.string().min(1, "Select a patient"),
  dueOn: dateOnlySchema,
  note: z.string().trim().max(300, "Reminder note is too long").optional().nullable(),
})

export async function createReminder(payload: unknown) {
  const parsed = createReminderSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid reminder")
  }
  const dueOn = dateOnlyToUtc(parsed.data.dueOn)
  const patient = await prisma.patientProfile.findUnique({
    where: { id: parsed.data.patientId },
    select: { id: true },
  })
  if (!patient) throw new Error("Patient not found")

  const existing = await prisma.patientReminder.findFirst({
    where: {
      patientId: patient.id,
      dueOn,
      status: "PENDING",
    },
    select: { id: true },
  })
  if (existing) throw new Error("This patient already has a reminder on that date")

  const reminder = await prisma.patientReminder.create({
    data: {
      patientId: patient.id,
      dueOn,
      note: parsed.data.note?.trim() || null,
    },
    include: { patient: { select: { name: true, phone: true } } },
  })
  return mapReminder(reminder)
}

const reminderStatusSchema = z.object({
  status: z.enum(["completed", "dismissed", "remind-next-month"]),
  dueOn: dateOnlySchema.optional(),
})

export async function resolveReminder(id: string, payload: unknown) {
  const parsed = reminderStatusSchema.safeParse(payload)
  if (!parsed.success) throw new Error("Invalid reminder status")
  if (parsed.data.status === "remind-next-month") {
    if (!parsed.data.dueOn) throw new Error("The next reminder date is required")
    const dueOn = dateOnlyToUtc(parsed.data.dueOn)
    await prisma.$transaction(async (tx) => {
      const current = await tx.patientReminder.findFirst({
        where: { id, status: "PENDING" },
      })
      if (!current) throw new Error("Reminder was not found or is already resolved")
      const duplicate = await tx.patientReminder.findFirst({
        where: { patientId: current.patientId, dueOn, status: "PENDING" },
        select: { id: true },
      })
      if (duplicate) throw new Error("This patient already has a reminder on that date")
      await tx.patientReminder.create({
        data: {
          patientId: current.patientId,
          dueOn,
          note: current.note,
        },
      })
      await tx.patientReminder.update({
        where: { id: current.id },
        data: { status: "COMPLETED", resolvedAt: new Date() },
      })
    })
    return
  }
  const result = await prisma.patientReminder.updateMany({
    where: { id, status: "PENDING" },
    data: {
      status: parsed.data.status === "completed" ? "COMPLETED" : "DISMISSED",
      resolvedAt: new Date(),
    },
  })
  if (result.count !== 1) throw new Error("Reminder was not found or is already resolved")
}
