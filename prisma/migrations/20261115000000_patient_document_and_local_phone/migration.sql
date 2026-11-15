ALTER TABLE "PatientProfile"
ADD COLUMN "documentNumber" TEXT;

-- Store Syrian patient phone numbers in the local 10-digit form (09xxxxxxxx).
UPDATE "PatientProfile" AS profile
SET "phone" = '0' || RIGHT(REGEXP_REPLACE(profile."phone", '[^0-9]', '', 'g'), 9)
WHERE profile."phone" IS NOT NULL
  AND REGEXP_REPLACE(profile."phone", '[^0-9]', '', 'g') ~ '^9639[0-9]{8}$'
  AND NOT EXISTS (
    SELECT 1
    FROM "PatientProfile" AS duplicate
    WHERE duplicate."id" <> profile."id"
      AND duplicate."phone" = '0' || RIGHT(REGEXP_REPLACE(profile."phone", '[^0-9]', '', 'g'), 9)
  );
