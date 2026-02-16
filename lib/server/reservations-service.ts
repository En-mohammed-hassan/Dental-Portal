import { Prisma, PrismaClient } from "@prisma/client"
import { z } from "zod"

import {
  type NewPatientInput,
  type NewReservationInput,
  type Patient,
  type PatientProfile,
  type BloodType as AppBloodType,
  type BookingType as AppBookingType,
  type ReservationStatus as AppReservationStatus,
} from "@/types/patient"
import { type ReservationsData } from "@/types/reservations"
import { sortByAppointmentDate } from "@/utils/patient"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

const supportsXrayImageBase64Field = Prisma.dmmf.datamodel.models.some(
  (model) =>
    model.name === "PatientProfile" &&
    model.fields.some((field) => field.name === "xrayImageBase64")
)

const supportsReservationXrayImageBase64Field = Prisma.dmmf.datamodel.models.some(
  (model) =>
    model.name === "Reservation" &&
    model.fields.some((field) => field.name === "xrayImageBase64")
)

// Debug: Log if field is supported (remove in production)
if (process.env.NODE_ENV !== "production") {
  console.log(
    "[DEBUG] Reservation xrayImageBase64 field supported:",
    supportsReservationXrayImageBase64Field
  )
}

const bloodTypeToDb: Record<AppBloodType, string> = {
  "A+": "A_POS",
  "A-": "A_NEG",
  "B+": "B_POS",
  "B-": "B_NEG",
  "AB+": "AB_POS",
  "AB-": "AB_NEG",
  "O+": "O_POS",
  "O-": "O_NEG",
}

const bloodTypeFromDb: Record<string, AppBloodType> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
}

const bookingTypeToDb: Record<
  AppBookingType,
  string
> = {
  advance: "ADVANCE",
  "walk-in": "WALK_IN",
  emergency: "EMERGENCY",
}

const bookingTypeFromDb: Record<string, AppBookingType> = {
  ADVANCE: "advance",
  WALK_IN: "walk-in",
  EMERGENCY: "emergency",
}

const reservationStatusFromDb: Record<string, AppReservationStatus> = {
  CURRENT: "current",
  WAITING: "waiting",
  UPCOMING: "upcoming",
  COMPLETED: "completed",
}

const patientProfilePayloadSchema = z.object({
  name: z.string().trim().min(3).max(80),
  phone: z.string().regex(/^0\d{9}$/),
  age: z.coerce.number().int().positive(),
  bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  xrayImageBase64: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^data:image\/[a-zA-Z+.-]+;base64,/.test(value),
      "X-ray image must be a valid base64 image"
    )
    .optional()
    .or(z.literal("")),
})

function mapReservationFromDb(patient: {
  id: string
  patientId: string
  bookingType: string
  appointmentDate: Date
  hasArrived: boolean
  createdAt: Date
  completedAt?: Date | null
  treatmentNote?: string | null
  xrayImageBase64?: string | null
  patient: {
    name: string
    phone: string
    age: number
    bloodType: string
    xrayImageBase64?: string | null
  }
}): Patient {
  return {
    id: patient.id,
    patientId: patient.patientId,
    name: patient.patient.name,
    phone: patient.patient.phone,
    age: patient.patient.age,
    bloodType: bloodTypeFromDb[patient.patient.bloodType],
    bookingType: bookingTypeFromDb[patient.bookingType],
    appointmentDate: patient.appointmentDate.toISOString().slice(0, 10),
    hasArrived: patient.hasArrived,
    createdAt: patient.createdAt.toISOString(),
    completedAt: patient.completedAt ? patient.completedAt.toISOString() : null,
    treatmentNote: patient.treatmentNote ?? null,
    xrayImageBase64: patient.xrayImageBase64 ?? null,
  }
}

function mapPatientProfileFromDb(patient: {
  id: string
  name: string
  phone: string
  age: number
  bloodType: string
  xrayImageBase64?: string | null
  xrayImageUrl?: string | null
  createdAt: Date
  reservations?: Array<{
    id: string
    bookingType: string
    status: string
    appointmentDate: Date
    hasArrived: boolean
    createdAt: Date
    completedAt?: Date | null
    treatmentNote?: string | null
    xrayImageBase64?: string | null
  }>
}): PatientProfile {
  return {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    age: patient.age,
    bloodType: bloodTypeFromDb[patient.bloodType],
    xrayImageBase64: patient.xrayImageBase64 ?? patient.xrayImageUrl ?? null,
    createdAt: patient.createdAt.toISOString(),
    linkedReservations: patient.reservations?.map((reservation) => ({
      id: reservation.id,
      bookingType: bookingTypeFromDb[reservation.bookingType],
      status: reservationStatusFromDb[reservation.status],
      appointmentDate: reservation.appointmentDate.toISOString().slice(0, 10),
      hasArrived: reservation.hasArrived,
      createdAt: reservation.createdAt.toISOString(),
      completedAt: reservation.completedAt ? reservation.completedAt.toISOString() : null,
      treatmentNote: reservation.treatmentNote ?? null,
      xrayImageBase64: reservation.xrayImageBase64 ?? null,
    })),
  }
}

async function ensureUniquePhone(phone: string, excludePatientId?: string): Promise<void> {
  const existing = await prisma.patientProfile.findFirst({
    where: {
      phone,
      ...(excludePatientId ? { id: { not: excludePatientId } } : {}),
    },
    select: { id: true },
  })

  if (existing) {
    throw new Error("Phone number already exists")
  }
}

async function toReservationsData(): Promise<ReservationsData> {
  const [current, waiting, upcoming, history] = await Promise.all([
    prisma.reservation.findFirst({
      where: { status: "CURRENT" },
      orderBy: { createdAt: "desc" },
      include: { patient: true },
    }),
    prisma.reservation.findMany({
      where: { status: "WAITING" },
      orderBy: [{ bookingType: "desc" }, { createdAt: "asc" }],
      include: { patient: true },
    }),
    prisma.reservation.findMany({
      where: { status: "UPCOMING" },
      orderBy: [{ appointmentDate: "asc" }, { createdAt: "asc" }],
      include: { patient: true },
    }),
    prisma.reservation.findMany({
      where: { status: "COMPLETED" },
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      include: { patient: true },
    }),
  ])

  return {
    currentPatient: current
      ? mapReservationFromDb(current as Parameters<typeof mapReservationFromDb>[0])
      : null,
    waitingPatients: waiting.map(
      (item) => mapReservationFromDb(item as Parameters<typeof mapReservationFromDb>[0])
    ),
    upcomingPatients: sortByAppointmentDate(
      upcoming.map((item) => mapReservationFromDb(item as Parameters<typeof mapReservationFromDb>[0]))
    ),
    treatmentHistory: history.map(
      (item) => mapReservationFromDb(item as Parameters<typeof mapReservationFromDb>[0])
    ),
  }
}

export async function getReservations(): Promise<ReservationsData> {
  return toReservationsData()
}

export async function addReservation(payload: NewReservationInput): Promise<ReservationsData> {
  if (!payload.patientId && !payload.patient) {
    throw new Error("Please select an existing patient or create a new one")
  }

  const bookingType = bookingTypeToDb[payload.bookingType]
  if (!bookingType) {
    throw new Error("Invalid booking type")
  }

  if (!payload.appointmentDate || Number.isNaN(Date.parse(payload.appointmentDate))) {
    throw new Error("Invalid appointment date")
  }

  let patientId = payload.patientId

  if (!patientId && payload.patient) {
    const parsedPatient = patientProfilePayloadSchema.safeParse(payload.patient)
    if (!parsedPatient.success) {
      throw new Error(parsedPatient.error.issues[0]?.message ?? "Invalid patient data")
    }

    const xrayImageBase64 = parsedPatient.data.xrayImageBase64?.trim()
    await ensureUniquePhone(parsedPatient.data.phone)

    let createdPatient
    try {
      createdPatient = await prisma.patientProfile.create({
        data: {
          name: parsedPatient.data.name,
          phone: parsedPatient.data.phone,
          age: parsedPatient.data.age,
          bloodType: bloodTypeToDb[parsedPatient.data.bloodType] as never,
          ...(supportsXrayImageBase64Field && xrayImageBase64
            ? { xrayImageBase64 }
            : {}),
        },
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new Error("Phone number already exists")
      }
      throw error
    }
    patientId = createdPatient.id
  }

  const existingPatient = patientId
    ? await prisma.patientProfile.findUnique({ where: { id: patientId } })
    : null

  if (!existingPatient) {
    throw new Error("Selected patient was not found")
  }

  await prisma.reservation.create({
    data: {
      patientId: existingPatient.id,
      bookingType: bookingType as never,
      appointmentDate: new Date(payload.appointmentDate),
      hasArrived: payload.bookingType !== "advance",
      status: payload.bookingType === "advance" ? "UPCOMING" : "WAITING",
    },
  })

  return toReservationsData()
}

export async function markAsArrived(reservationId: string): Promise<ReservationsData> {
  const patient = await prisma.reservation.findUnique({ where: { id: reservationId } })
  if (!patient || patient.status !== "UPCOMING") {
    throw new Error("Upcoming patient not found")
  }

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "WAITING", hasArrived: true },
  })

  return toReservationsData()
}

export async function startTreatment(
  reservationId: string,
  replaceCurrent: boolean
): Promise<ReservationsData> {
  const selectedReservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  })

  if (!selectedReservation || selectedReservation.status !== "WAITING") {
    throw new Error("Waiting patient not found")
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const currentReservation = await tx.reservation.findFirst({
      where: { status: "CURRENT" },
      orderBy: { createdAt: "desc" },
    })

    if (currentReservation && !replaceCurrent) {
      throw new Error("Current patient exists and replacement is not allowed")
    }

    if (currentReservation) {
      await tx.reservation.update({
        where: { id: currentReservation.id },
        data: { status: "WAITING", hasArrived: true },
      })
    }

    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CURRENT", hasArrived: true },
    })
  })

  return toReservationsData()
}

export async function finishTreatment(
  treatmentNote: string,
  xrayImageBase64?: string | null
): Promise<ReservationsData> {
  const trimmed = treatmentNote.trim()
  if (trimmed.length < 5) {
    throw new Error("Treatment note is required and must be at least 5 characters")
  }

  // Find current reservation first, then update it
  const currentReservation = await prisma.reservation.findFirst({
    where: { status: "CURRENT" },
  })

  if (!currentReservation) {
    throw new Error("No current treatment found")
  }

  // Process X-ray image - trim if it exists, otherwise set to null
  const xrayImage = xrayImageBase64 && xrayImageBase64.trim() ? xrayImageBase64.trim() : null

  // Debug logging (remove in production)
  if (process.env.NODE_ENV !== "production") {
    console.log("[DEBUG] finishTreatment - xrayImageBase64 received:", xrayImageBase64 ? "YES" : "NO")
    console.log("[DEBUG] finishTreatment - xrayImage processed:", xrayImage ? "YES" : "NO")
    console.log("[DEBUG] finishTreatment - field supported:", supportsReservationXrayImageBase64Field)
  }

  // Build update data - always include xrayImageBase64 since the field exists in schema
  const updateData = {
    status: "COMPLETED" as const,
    completedAt: new Date(),
    treatmentNote: trimmed,
    xrayImageBase64: xrayImage,
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[DEBUG] finishTreatment - updateData:", {
      ...updateData,
      xrayImageBase64: updateData.xrayImageBase64 ? "PRESENT" : "NULL",
    })
  }

  await prisma.reservation.update({
    where: { id: currentReservation.id },
    data: updateData as never,
  })

  if (process.env.NODE_ENV !== "production") {
    console.log("[DEBUG] finishTreatment - reservation updated successfully")
  }

  return toReservationsData()
}

export async function cancelUpcomingAdvanceReservation(
  reservationId: string
): Promise<ReservationsData> {
  const target = await prisma.reservation.findUnique({ where: { id: reservationId } })

  if (!target) {
    throw new Error("Reservation not found")
  }

  if (target.status === "CURRENT" || target.status === "COMPLETED") {
    throw new Error("Current or completed treatments cannot be canceled")
  }

  await prisma.reservation.delete({
    where: { id: reservationId },
  })

  return toReservationsData()
}

export async function deleteReservation(reservationId: string): Promise<ReservationsData> {
  const target = await prisma.reservation.findUnique({ where: { id: reservationId } })

  if (!target) {
    throw new Error("Reservation not found")
  }

  if (target.status === "CURRENT") {
    throw new Error("Cannot delete current treatment. Please finish it first.")
  }

  await prisma.reservation.delete({
    where: { id: reservationId },
  })

  return toReservationsData()
}

export async function listPatients(search?: string): Promise<PatientProfile[]> {
  const normalized = search?.trim()
  const patients = await prisma.patientProfile.findMany({
    where: normalized
      ? {
          OR: [
            { name: { contains: normalized } },
            { phone: { contains: normalized } },
          ],
        }
      : undefined,
    orderBy: [{ name: "asc" }],
    include: {
      reservations: {
        select: (supportsReservationXrayImageBase64Field
          ? {
              id: true,
              bookingType: true,
              status: true,
              appointmentDate: true,
              hasArrived: true,
              createdAt: true,
              completedAt: true,
              treatmentNote: true,
              xrayImageBase64: true,
            }
          : {
              id: true,
              bookingType: true,
              status: true,
              appointmentDate: true,
              hasArrived: true,
              createdAt: true,
              completedAt: true,
              treatmentNote: true,
            }) as never,
        orderBy: [{ createdAt: "desc" }],
      },
    },
  })

  return patients.map((patient) =>
    mapPatientProfileFromDb(patient as unknown as Parameters<typeof mapPatientProfileFromDb>[0])
  )
}

export async function createPatientProfile(payload: NewPatientInput): Promise<PatientProfile> {
  const parsed = patientProfilePayloadSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid patient data")
  }

  const xrayImageBase64 = parsed.data.xrayImageBase64?.trim()
  await ensureUniquePhone(parsed.data.phone)

  let patient
  try {
    patient = await prisma.patientProfile.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        age: parsed.data.age,
        bloodType: bloodTypeToDb[parsed.data.bloodType] as never,
        ...(supportsXrayImageBase64Field && xrayImageBase64 ? { xrayImageBase64 } : {}),
      },
      include: {
        reservations: {
          select: {
            id: true,
            bookingType: true,
            status: true,
            appointmentDate: true,
            hasArrived: true,
            createdAt: true,
            completedAt: true,
            treatmentNote: true,
          },
        },
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Phone number already exists")
    }
    throw error
  }

  return mapPatientProfileFromDb(patient)
}

export async function updatePatientProfile(
  patientId: string,
  payload: NewPatientInput
): Promise<PatientProfile> {
  const parsed = patientProfilePayloadSchema.safeParse(payload)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid patient data")
  }

  const xrayImageBase64 = parsed.data.xrayImageBase64?.trim()
  await ensureUniquePhone(parsed.data.phone, patientId)

  let patient
  try {
    patient = await prisma.patientProfile.update({
      where: { id: patientId },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        age: parsed.data.age,
        bloodType: bloodTypeToDb[parsed.data.bloodType] as never,
        ...(supportsXrayImageBase64Field
          ? { xrayImageBase64: xrayImageBase64 || null }
          : {}),
      },
      include: {
        reservations: {
          select: {
            id: true,
            bookingType: true,
            status: true,
            appointmentDate: true,
            hasArrived: true,
            createdAt: true,
            completedAt: true,
            treatmentNote: true,
          },
        },
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("Phone number already exists")
    }
    throw error
  }

  return mapPatientProfileFromDb(patient)
}

export async function deletePatientProfile(patientId: string): Promise<void> {
  const existing = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { id: true },
  })

  if (!existing) {
    throw new Error("Patient not found")
  }

  // Delete all reservations first (cascade will handle it, but we do it explicitly for clarity)
  await prisma.reservation.deleteMany({
    where: { patientId },
  })

  const deleted = await prisma.patientProfile.deleteMany({
    where: { id: patientId },
  })

  if (deleted.count === 0) {
    throw new Error("Patient not found")
  }
}

