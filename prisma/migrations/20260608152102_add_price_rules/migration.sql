-- CreateTable
CREATE TABLE "price_rules" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "pricePerHour" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "price_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_rules_venueId_idx" ON "price_rules"("venueId");

-- AddForeignKey
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
