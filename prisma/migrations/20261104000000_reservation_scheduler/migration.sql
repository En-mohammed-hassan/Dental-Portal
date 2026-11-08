-- Keep this migration additive so the legacy public BookingSlot flow continues to work.
CREATE TYPE "ServiceType" AS ENUM ('DENTAL', 'LASER');
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'BOOKED', 'COMPLETED', 'DISMISSED');

ALTER TABLE "PatientProfile"
  ALTER COLUMN "phone" DROP NOT NULL,
  ALTER COLUMN "age" DROP NOT NULL,
  ALTER COLUMN "bloodType" DROP NOT NULL;

ALTER TABLE "Reservation"
  ADD COLUMN "endsAt" TIMESTAMP(3),
  ADD COLUMN "serviceType" "ServiceType" NOT NULL DEFAULT 'DENTAL';

UPDATE "Reservation" AS reservation
SET "endsAt" = COALESCE(
  (SELECT slot."endsAt" FROM "BookingSlot" AS slot WHERE slot."id" = reservation."slotId"),
  reservation."appointmentDate" + INTERVAL '30 minutes'
)
WHERE reservation."endsAt" IS NULL;

ALTER TABLE "Reservation" ALTER COLUMN "endsAt" SET NOT NULL;

CREATE TABLE "PatientReminder" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "dueOn" DATE NOT NULL,
  "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "reservationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "PatientReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PatientReminder_reservationId_key" ON "PatientReminder"("reservationId");
CREATE INDEX "PatientReminder_dueOn_status_idx" ON "PatientReminder"("dueOn", "status");
CREATE INDEX "PatientReminder_patientId_idx" ON "PatientReminder"("patientId");
CREATE INDEX "Reservation_status_appointmentDate_idx" ON "Reservation"("status", "appointmentDate");
CREATE INDEX "Reservation_endsAt_idx" ON "Reservation"("endsAt");

ALTER TABLE "PatientReminder"
  ADD CONSTRAINT "PatientReminder_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientReminder"
  ADD CONSTRAINT "PatientReminder_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
