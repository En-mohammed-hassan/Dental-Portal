import { Prisma } from "@prisma/client"
import { z } from "zod"

import { sendSms, treatmentDoneMessage } from "@/lib/sms"

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

import { normalizeTeethTreated } from "@/lib/dental/fdi-teeth"
import { buildProfilePhoneCandidates, normalizeToE164 } from "@/lib/phone"

import { prisma } from "./db"

// Safely check if fields are supported (handle cases where DMMF might not be available during build)
function checkFieldSupport(modelName: string, fieldName: string): boolean {
  try {
    // Check if Prisma and DMMF are available
    if (typeof Prisma === "undefined" || !Prisma.dmmf || !Prisma.dmmf.datamodel) {
      // During build or when Prisma client isn't generated, assume fields exist
      return true
    }
    return (
      Prisma.dmmf.datamodel.models?.some(
        (model) =>
          model.name === modelName &&
          model.fields.some((field) => field.name === fieldName)
      ) ?? false
    )
  } catch {
    // If DMMF is not available (e.g., during build), assume field exists if schema has it
    // This is a safe default since the schema should be up to date
    return true
  }
}

const supportsXrayImageBase64Field = checkFieldSupport("PatientProfile", "xrayImageBase64")

const supportsReservationXrayImageBase64Field = checkFieldSupport(
  "Reservation",
  "xrayImageBase64"
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

type AppPaymentStatus = import("@/types/patient").PaymentStatusLabel

const paymentStatusToDb: Record<AppPaymentStatus, "UNPAID" | "PARTIAL" | "PAID"> = {
  unpaid: "UNPAID",
  partial: "PARTIAL",
  paid: "PAID",
}

const paymentStatusFromDb: Record<string, AppPaymentStatus> = {
  UNPAID: "unpaid",
  PARTIAL: "partial",
  PAID: "paid",
}

const patientProfilePayloadSchema = z.object({
  name: z.string().trim().min(3).max(80),
  phone: z.string().min(4),
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
  feeCents?: number | null
  paymentStatus?: string | null
  canalsCount?: number | null
  teethTreated?: unknown
  procedureSummary?: string | null
  patient: {
    name: string
    phone: string
    age: number
    bloodType: string
    xrayImageBase64?: string | null
  }
}): Patient {
  const ps = patient.paymentStatus
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
    feeCents: patient.feeCents ?? null,
    paymentStatus: ps && paymentStatusFromDb[ps] ? paymentStatusFromDb[ps] : null,
    canalsCount: patient.canalsCount ?? null,
    teethTreated: normalizeTeethTreated(patient.teethTreated),
    procedureSummary: patient.procedureSummary ?? null,
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
  const candidates = buildProfilePhoneCandidates(phone, "SY")
  const normalized = normalizeToE164(phone, "SY")
  if (!normalized) {
    throw new Error("Invalid phone number format")
  }
  const existing = await prisma.patientProfile.findFirst({
    where: {
      phone: { in: [...new Set([normalized, ...candidates])] },
      ...(excludePatientId ? { id: { not: excludePatientId } } : {}),
    },
    select: { id: true },
  })

  if (existing) {
    throw new Error("Phone number already exists")
  }
}

function normalizePhoneOrThrow(phone: string): string {
  const normalized = normalizeToE164(phone, "SY")
  if (!normalized) {
    throw new Error("Invalid phone number format")
  }
  return normalized
}

// Helper to build patient select object
const getPatientSelect = () => ({
  name: true,
  phone: true,
  age: true,
  bloodType: true,
  ...(supportsXrayImageBase64Field ? { xrayImageBase64: true } : {}),
})

// Helper to build reservation select object
const getReservationSelect = () => ({
  id: true,
  patientId: true,
  bookingType: true,
  appointmentDate: true,
  hasArrived: true,
  status: true,
  createdAt: true,
  completedAt: true,
  treatmentNote: true,
  feeCents: true,
  paymentStatus: true,
  canalsCount: true,
  teethTreated: true,
  procedureSummary: true,
  ...(supportsReservationXrayImageBase64Field ? { xrayImageBase64: true } : {}),
  patient: {
    select: getPatientSelect(),
  },
})

async function toReservationsData(): Promise<ReservationsData> {
  const [current, waiting, upcoming] = await Promise.all([
    prisma.reservation.findFirst({
      where: { status: "CURRENT" },
      orderBy: { createdAt: "desc" },
      select: getReservationSelect(),
    }),
    prisma.reservation.findMany({
      where: { status: "WAITING" },
      orderBy: [{ bookingType: "desc" }, { createdAt: "asc" }],
      select: getReservationSelect(),
    }),
    prisma.reservation.findMany({
      where: { status: "UPCOMING" },
      orderBy: [{ appointmentDate: "asc" }, { createdAt: "asc" }],
      select: getReservationSelect(),
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
    treatmentHistory: [],
  }
}

export type TreatmentHistoryPageResult = {
  items: Patient[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function listTreatmentHistoryPage(options: {
  page: number
  pageSize: number
  q?: string
  bookingType?: AppBookingType | "all"
  completedFrom?: string
  completedTo?: string
}): Promise<TreatmentHistoryPageResult> {
  const page = Math.max(1, Math.floor(options.page) || 1)
  const pageSize = Math.min(100, Math.max(5, Math.floor(options.pageSize) || 20))

  const where: Prisma.ReservationWhereInput = { status: "COMPLETED" }

  if (options.bookingType && options.bookingType !== "all") {
    where.bookingType = bookingTypeToDb[options.bookingType] as never
  }

  const q = options.q?.trim()
  if (q) {
    where.OR = [
      { treatmentNote: { contains: q, mode: "insensitive" } },
      { procedureSummary: { contains: q, mode: "insensitive" } },
      { patient: { name: { contains: q, mode: "insensitive" } } },
      { patient: { phone: { contains: q } } },
    ]
  }

  const completedFilter: Prisma.DateTimeNullableFilter = {}
  if (options.completedFrom?.trim()) {
    const d = new Date(`${options.completedFrom.trim()}T00:00:00.000Z`)
    if (!Number.isNaN(d.getTime())) {
      completedFilter.gte = d
    }
  }
  if (options.completedTo?.trim()) {
    const d = new Date(`${options.completedTo.trim()}T23:59:59.999Z`)
    if (!Number.isNaN(d.getTime())) {
      completedFilter.lte = d
    }
  }
  if (Object.keys(completedFilter).length > 0) {
    where.completedAt = completedFilter
  }

  const [total, rows] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: getReservationSelect(),
    }),
  ])

  const items = rows.map((item) =>
    mapReservationFromDb(item as Parameters<typeof mapReservationFromDb>[0])
  )
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return { items, total, page, pageSize, totalPages }
}

export async function getReservations(): Promise<ReservationsData> {
  return toReservationsData()
}

export async function listReservationsForPatient(patientProfileId: string): Promise<Patient[]> {
  const rows = await prisma.reservation.findMany({
    where: { patientId: patientProfileId },
    orderBy: [{ appointmentDate: "desc" }, { createdAt: "desc" }],
    take: 50,
    select: getReservationSelect(),
  })
  return rows.map((item) =>
    mapReservationFromDb(item as Parameters<typeof mapReservationFromDb>[0])
  )
}

export async function addReservation(payload: NewReservationInput): Promise<ReservationsData> {
  if (!payload.patientId && !payload.patient) {
    throw new Error("Please select an existing patient or create a new one")
  }

  const bookingType = bookingTypeToDb[payload.bookingType]
  if (!bookingType) {
    throw new Error("Invalid booking type")
  }

  let appointmentDateTime: Date
  let slotId: string | undefined

  if (payload.slotId) {
    if (payload.bookingType !== "advance") {
      throw new Error("Slot booking must use advance type")
    }
    const slot = await prisma.bookingSlot.findFirst({
      where: { id: payload.slotId, isActive: true },
    })
    if (!slot) {
      throw new Error("This time slot is not available")
    }
    if (slot.endsAt < new Date()) {
      throw new Error("This time slot has already passed")
    }
    const taken = await prisma.reservation.count({
      where: {
        slotId: slot.id,
        status: { in: ["UPCOMING", "WAITING", "CURRENT"] },
      },
    })
    if (taken >= slot.capacity) {
      throw new Error("This time slot is fully booked")
    }
    appointmentDateTime = slot.startsAt
    slotId = slot.id
  } else {
    if (!payload.appointmentDate || Number.isNaN(Date.parse(payload.appointmentDate))) {
      throw new Error("Invalid appointment date")
    }
    appointmentDateTime = new Date(payload.appointmentDate)
  }

  let patientId = payload.patientId

  if (!patientId && payload.patient) {
    const parsedPatient = patientProfilePayloadSchema.safeParse(payload.patient)
    if (!parsedPatient.success) {
      throw new Error(parsedPatient.error.issues[0]?.message ?? "Invalid patient data")
    }

    const xrayImageBase64 = parsedPatient.data.xrayImageBase64?.trim()
    const normalizedPhone = normalizePhoneOrThrow(parsedPatient.data.phone)
    await ensureUniquePhone(normalizedPhone)

    let createdPatient
    try {
      createdPatient = await prisma.patientProfile.create({
        data: {
          name: parsedPatient.data.name,
          phone: normalizedPhone,
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
      appointmentDate: appointmentDateTime,
      hasArrived: Boolean(payload.slotId) ? false : payload.bookingType !== "advance",
      status: payload.bookingType === "advance" || payload.slotId ? "UPCOMING" : "WAITING",
      ...(slotId ? { slotId } : {}),
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

export async function finishTreatment(payload: {
  treatmentNote: string
  xrayImageBase64?: string | null
  feeCents?: number | null
  paymentStatus?: AppPaymentStatus | null
  canalsCount?: number | null
  teethTreated?: string[] | null
  procedureSummary?: string | null
}): Promise<ReservationsData> {
  const trimmed = payload.treatmentNote.trim()
  if (trimmed.length < 5) {
    throw new Error("Treatment note is required and must be at least 5 characters")
  }

  const currentReservation = await prisma.reservation.findFirst({
    where: { status: "CURRENT" },
  })

  if (!currentReservation) {
    throw new Error("No current treatment found")
  }

  const xrayImage =
    payload.xrayImageBase64 && payload.xrayImageBase64.trim()
      ? payload.xrayImageBase64.trim()
      : null

  const feeCents =
    payload.feeCents != null && Number.isFinite(Number(payload.feeCents))
      ? Math.max(0, Math.min(500_000_000, Math.round(Number(payload.feeCents))))
      : null

  const canalsCount =
    payload.canalsCount != null && Number.isFinite(Number(payload.canalsCount))
      ? Math.min(8, Math.max(0, Math.round(Number(payload.canalsCount))))
      : null

  const teethNormalized = normalizeTeethTreated(payload.teethTreated ?? null)
  const procedureSummary = payload.procedureSummary?.trim()
    ? payload.procedureSummary.trim().slice(0, 120)
    : null

  const paymentStatus =
    payload.paymentStatus && paymentStatusToDb[payload.paymentStatus]
      ? paymentStatusToDb[payload.paymentStatus]
      : null

  const updateData = {
    status: "COMPLETED" as const,
    completedAt: new Date(),
    treatmentNote: trimmed,
    xrayImageBase64: xrayImage,
    feeCents,
    paymentStatus: paymentStatus as never,
    canalsCount,
    teethTreated: teethNormalized === null ? null : (teethNormalized as Prisma.InputJsonValue),
    procedureSummary,
  }

  await prisma.reservation.update({
    where: { id: currentReservation.id },
    data: updateData as never,
  })

  const patientRow = await prisma.patientProfile.findUnique({
    where: { id: currentReservation.patientId },
    select: { name: true, phone: true },
  })
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
    select: { clinicName: true },
  })
  const clinicName = settings?.clinicName ?? "Our clinic"
  if (patientRow?.phone) {
    void sendSms(
      patientRow.phone,
      treatmentDoneMessage(patientRow.name.split(" ")[0] ?? patientRow.name, clinicName)
    )
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
  const normalized = search?.trim()?.toLowerCase()
  const patients = await prisma.patientProfile.findMany({
    where: normalized
      ? {
          OR: [
            { name: { contains: normalized, mode: "insensitive" } },
            { phone: { contains: normalized } },
          ],
        }
      : undefined,
    orderBy: [{ name: "asc" }],
    // Optimize: Only fetch reservations when needed (they're loaded on-demand in the UI)
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
        take: 50, // Limit to recent 50 reservations per patient for performance
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
  const normalizedPhone = normalizePhoneOrThrow(parsed.data.phone)
  await ensureUniquePhone(normalizedPhone)

  let patient
  try {
    patient = await prisma.patientProfile.create({
      data: {
        name: parsed.data.name,
        phone: normalizedPhone,
        age: parsed.data.age,
        bloodType: bloodTypeToDb[parsed.data.bloodType] as never,
        ...(supportsXrayImageBase64Field && xrayImageBase64 ? { xrayImageBase64 } : {}),
      },
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
          take: 50, // Limit to recent 50 reservations for performance
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

  return mapPatientProfileFromDb(patient as unknown as Parameters<typeof mapPatientProfileFromDb>[0])
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
  const normalizedPhone = normalizePhoneOrThrow(parsed.data.phone)
  await ensureUniquePhone(normalizedPhone, patientId)

  let patient
  try {
    // Optimize: Only fetch reservations metadata (id, status, dates) for linked reservations display
    // This is much faster than fetching all reservation fields
    patient = await prisma.patientProfile.update({
      where: { id: patientId },
      data: {
        name: parsed.data.name,
        phone: normalizedPhone,
        age: parsed.data.age,
        bloodType: bloodTypeToDb[parsed.data.bloodType] as never,
        ...(supportsXrayImageBase64Field
          ? { xrayImageBase64: xrayImageBase64 || null }
          : {}),
      },
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
          take: 50, // Limit to recent 50 reservations to avoid loading too much data
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

  return mapPatientProfileFromDb(patient as unknown as Parameters<typeof mapPatientProfileFromDb>[0])
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

