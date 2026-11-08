import { z } from "zod"

import { BLOOD_TYPES, BOOKING_TYPES } from "@/types/patient"

const phoneRegex = /^0\d{9}$/

export const patientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || phoneRegex.test(value),
      "Phone must be exactly 10 digits (e.g. 0993198176)"
    )
    .optional(),
  age: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce.number().int().positive("Age must be greater than 0").nullable()
  ),
  bloodType: z.enum(BLOOD_TYPES).nullable().optional(),
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
