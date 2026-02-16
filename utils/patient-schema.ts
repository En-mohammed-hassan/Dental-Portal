import { z } from "zod"

import { BLOOD_TYPES, BOOKING_TYPES } from "@/types/patient"

const phoneRegex = /^0\d{9}$/

export const patientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(80, "Name is too long"),
  phone: z.string().regex(phoneRegex, "Phone must be exactly 10 digits (e.g. 0993198176)"),
  age: z.coerce.number().int().positive("Age must be greater than 0"),
  bloodType: z.enum(BLOOD_TYPES, {
    error: "Please select a blood type",
  }),
  bookingType: z.enum(BOOKING_TYPES, {
    error: "Please select a booking type",
  }),
  appointmentDate: z
    .string()
    .min(1, "Appointment date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid appointment date"),
})

export type PatientFormInputValues = z.input<typeof patientSchema>
export type PatientFormValues = z.infer<typeof patientSchema>
