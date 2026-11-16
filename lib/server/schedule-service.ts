import { prisma } from "@/lib/server/db"

const CLINIC_TIME_ZONE = process.env.CLINIC_TIME_ZONE || "Asia/Damascus"

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function clinicDateKey(date: Date): string {
  const parts = dateKeyFormatter.formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value
  const month = parts.find((part) => part.type === "month")?.value
  const day = parts.find((part) => part.type === "day")?.value
  return `${year}-${month}-${day}`
}

export async function getScheduleMonth(from: Date, to: Date) {
  const reservations = await prisma.reservation.findMany({
    where: { appointmentDate: { gte: from, lt: to } },
    select: { appointmentDate: true },
    orderBy: { appointmentDate: "asc" },
  })

  const counts = new Map<string, number>()
  for (const reservation of reservations) {
    const key = clinicDateKey(reservation.appointmentDate)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return [...counts.entries()].map(([date, reservationCount]) => ({
    date,
    reservationCount,
  }))
}

export async function getScheduleDay(from: Date, to: Date) {
  const rows = await prisma.reservation.findMany({
    where: { appointmentDate: { gte: from, lt: to } },
    orderBy: [{ appointmentDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      patientId: true,
      bookingType: true,
      status: true,
      hasArrived: true,
      appointmentDate: true,
      endsAt: true,
      createdAt: true,
      note: true,
      serviceType: true,
      patient: {
        select: {
          name: true,
          phone: true,
          documentNumber: true,
        },
      },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    patientId: row.patientId,
    patientName: row.patient.name,
    patientPhone: row.patient.phone,
    patientDocumentNumber: row.patient.documentNumber,
    bookingType: row.bookingType.toLowerCase().replace("_", "-"),
    status: row.status.toLowerCase(),
    hasArrived: row.hasArrived,
    startsAt: row.appointmentDate.toISOString(),
    endsAt: row.endsAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    durationMinutes: Math.max(
      0,
      Math.round((row.endsAt.getTime() - row.appointmentDate.getTime()) / 60_000)
    ),
    note: row.note,
    serviceType: row.serviceType.toLowerCase(),
  }))
}
