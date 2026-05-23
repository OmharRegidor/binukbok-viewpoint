-- AlterTable: high-entropy public-link token (separate from confirmation_code).
ALTER TABLE "bookings" ADD COLUMN "view_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_view_token_key" ON "bookings"("view_token");
