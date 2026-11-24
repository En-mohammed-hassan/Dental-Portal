-- Allow a reservation to keep lightweight contact details without creating a
-- permanent PatientProfile record.
ALTER TABLE "Reservation"
  ADD COLUMN "oneTimeName" TEXT,
  ADD COLUMN "oneTimePhone" TEXT,
  ALTER COLUMN "patientId" DROP NOT NULL;
