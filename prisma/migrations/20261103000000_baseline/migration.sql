-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BloodType" AS ENUM ('A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG');

-- CreateEnum
CREATE TYPE "public"."BookingType" AS ENUM ('ADVANCE', 'WALK_IN', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."LedgerEntryType" AS ENUM ('CHARGE', 'PAYMENT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('CURRENT', 'WAITING', 'UPCOMING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'SECRETARY', 'PATIENT');

-- CreateTable
CREATE TABLE "public"."AdminPhone" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contentAr" TEXT,
    "excerptAr" TEXT,
    "titleAr" TEXT,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingSlot" (
    "id" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "label" TEXT,

    CONSTRAINT "BookingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GalleryImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captionAr" TEXT,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientLedgerEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "reservationId" TEXT,
    "type" "public"."LedgerEntryType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "balanceAfterCents" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PatientProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "bloodType" "public"."BloodType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "xrayImageBase64" TEXT,
    "balanceDueCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bookingType" "public"."BookingType" NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "hasArrived" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ReservationStatus" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "treatmentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xrayImageBase64" TEXT,
    "slotId" TEXT,
    "canalsCount" INTEGER,
    "feeCents" INTEGER,
    "paymentStatus" "public"."PaymentStatus",
    "procedureSummary" TEXT,
    "teethTreated" JSONB,
    "balanceAfterCents" INTEGER,
    "chargeCents" INTEGER,
    "paymentCents" INTEGER,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ServiceItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceLabel" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "descriptionAr" TEXT,
    "priceLabelAr" TEXT,
    "titleAr" TEXT,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "clinicName" TEXT NOT NULL DEFAULT 'Elkood Dental',
    "heroTitle" TEXT NOT NULL DEFAULT 'Smile with confidence',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Modern dentistry, gentle care.',
    "heroImageUrl" TEXT,
    "aboutMarkdown" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "footerNote" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "marketingContent" JSONB DEFAULT '{}',
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "aboutMarkdownAr" TEXT,
    "addressAr" TEXT,
    "clinicNameAr" TEXT,
    "footerNoteAr" TEXT,
    "heroSubtitleAr" TEXT,
    "heroTitleAr" TEXT,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "role" "public"."UserRole" NOT NULL,
    "patientProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminPhone_createdAt_idx" ON "public"."AdminPhone"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AdminPhone_phone_key" ON "public"."AdminPhone"("phone" ASC);

-- CreateIndex
CREATE INDEX "BlogPost_published_publishedAt_idx" ON "public"."BlogPost"("published" ASC, "publishedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "public"."BlogPost"("slug" ASC);

-- CreateIndex
CREATE INDEX "BookingSlot_isActive_idx" ON "public"."BookingSlot"("isActive" ASC);

-- CreateIndex
CREATE INDEX "BookingSlot_startsAt_idx" ON "public"."BookingSlot"("startsAt" ASC);

-- CreateIndex
CREATE INDEX "GalleryImage_sortOrder_idx" ON "public"."GalleryImage"("sortOrder" ASC);

-- CreateIndex
CREATE INDEX "OtpCode_phone_createdAt_idx" ON "public"."OtpCode"("phone" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "PatientLedgerEntry_patientId_createdAt_idx" ON "public"."PatientLedgerEntry"("patientId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "PatientLedgerEntry_reservationId_idx" ON "public"."PatientLedgerEntry"("reservationId" ASC);

-- CreateIndex
CREATE INDEX "PatientProfile_name_idx" ON "public"."PatientProfile"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_phone_key" ON "public"."PatientProfile"("phone" ASC);

-- CreateIndex
CREATE INDEX "Reservation_appointmentDate_idx" ON "public"."Reservation"("appointmentDate" ASC);

-- CreateIndex
CREATE INDEX "Reservation_bookingType_idx" ON "public"."Reservation"("bookingType" ASC);

-- CreateIndex
CREATE INDEX "Reservation_completedAt_idx" ON "public"."Reservation"("completedAt" ASC);

-- CreateIndex
CREATE INDEX "Reservation_patientId_idx" ON "public"."Reservation"("patientId" ASC);

-- CreateIndex
CREATE INDEX "Reservation_slotId_idx" ON "public"."Reservation"("slotId" ASC);

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "public"."Reservation"("status" ASC);

-- CreateIndex
CREATE INDEX "ServiceItem_published_sortOrder_idx" ON "public"."ServiceItem"("published" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_patientProfileId_key" ON "public"."User"("patientProfileId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "public"."User"("phone" ASC);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role" ASC);

-- AddForeignKey
ALTER TABLE "public"."PatientLedgerEntry" ADD CONSTRAINT "PatientLedgerEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PatientLedgerEntry" ADD CONSTRAINT "PatientLedgerEntry_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "public"."BookingSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
