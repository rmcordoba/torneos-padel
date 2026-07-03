-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('PUBLIC', 'STAFF', 'FIXED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- AlterTable
ALTER TABLE "courts" ADD COLUMN     "bookingPrice" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "venue_schedules" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "openMinute" INTEGER NOT NULL,
    "closeMinute" INTEGER NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 90,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "venue_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "source" "BookingSource" NOT NULL DEFAULT 'STAFF',
    "playerProfileId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "price" DECIMAL(10,2),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "recurringBookingId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_bookings" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 90,
    "validFrom" DATE NOT NULL,
    "validUntil" DATE,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "price" DECIMAL(10,2),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "court_blocks" (
    "id" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "court_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venue_schedules_venueId_weekday_key" ON "venue_schedules"("venueId", "weekday");

-- CreateIndex
CREATE INDEX "bookings_courtId_date_idx" ON "bookings"("courtId", "date");

-- CreateIndex
CREATE INDEX "bookings_organizerId_date_idx" ON "bookings"("organizerId", "date");

-- CreateIndex
CREATE INDEX "recurring_bookings_courtId_weekday_idx" ON "recurring_bookings"("courtId", "weekday");

-- CreateIndex
CREATE INDEX "court_blocks_courtId_date_idx" ON "court_blocks"("courtId", "date");

-- AddForeignKey
ALTER TABLE "venue_schedules" ADD CONSTRAINT "venue_schedules_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_playerProfileId_fkey" FOREIGN KEY ("playerProfileId") REFERENCES "player_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_recurringBookingId_fkey" FOREIGN KEY ("recurringBookingId") REFERENCES "recurring_bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_bookings" ADD CONSTRAINT "recurring_bookings_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_bookings" ADD CONSTRAINT "recurring_bookings_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_blocks" ADD CONSTRAINT "court_blocks_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Anti-solape de reservas (red de seguridad a nivel de base)
-- btree_gist habilita combinar igualdad sobre texto (courtId) con un rango (gist).
-- tsrange usa límites [) → un turno que termina 20:00 NO choca con uno que arranca 20:00.
-- Solo aplica a reservas activas (PENDING/CONFIRMED); las canceladas no bloquean.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "courtId" WITH =,
    tsrange("startTime", "endTime") WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));
