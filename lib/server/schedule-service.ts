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
    select: { appointmentDate: true, serviceType: true },
    orderBy: { appointmentDate: "asc" },
  })

  const counts = new Map<string, number>()
  const now = Date.now()
  let upcomingDental = 0
  let upcomingLaser = 0

  for (const reservation of reservations) {
    const key = clinicDateKey(reservation.appointmentDate)
    counts.set(key, (counts.get(key) ?? 0) + 1)

    if (reservation.appointmentDate.getTime() > now) {
      if (reservation.serviceType === "LASER") {
        upcomingLaser += 1
      } else {
        upcomingDental += 1
      }
    }
  }

  return {
    days: [...counts.entries()].map(([date, reservationCount]) => ({
      date,
      reservationCount,
    })),
    summary: {
      totalReservations: reservations.length,
      upcomingReservations: upcomingDental + upcomingLaser,
      upcomingDental,
      upcomingLaser,
    },
  }
}

export async function getScheduleDay(from: Date, to: Date) {
  const rows = await prisma.reservation.findMany({
    where: { appointmentDate: { gte: from, lt: to } },
    orderBy: [{ appointmentDate: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      patientId: true,
      oneTimeName: true,
      oneTimePhone: true,
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
    patientName: row.patient?.name ?? row.oneTimeName ?? "One-time patient",
    patientPhone: row.patient?.phone ?? row.oneTimePhone ?? null,
    patientDocumentNumber: row.patient?.documentNumber ?? null,
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
