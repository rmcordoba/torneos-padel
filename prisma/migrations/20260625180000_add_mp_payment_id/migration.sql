-- AlterTable
ALTER TABLE "subscription_payments" ADD COLUMN "mpPaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_mpPaymentId_key" ON "subscription_payments"("mpPaymentId");
