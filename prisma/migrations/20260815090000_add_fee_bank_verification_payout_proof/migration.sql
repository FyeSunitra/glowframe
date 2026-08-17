CREATE TYPE "bank_account_verification_status" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "bookings"
  ADD COLUMN "platform_fee_rate_snapshot" DECIMAL(5,2),
  ADD COLUMN "platform_fee_amount" DECIMAL(12,2),
  ADD COLUMN "owner_receivable_amount" DECIMAL(12,2);

UPDATE "bookings"
SET
  "platform_fee_rate_snapshot" = COALESCE((SELECT "platform_fee" FROM "platform_settings" WHERE "id" = 1), 10),
  "platform_fee_amount" = ROUND(
    "rental_fee" * COALESCE((SELECT "platform_fee" FROM "platform_settings" WHERE "id" = 1), 10) / 100,
    2
  );

UPDATE "bookings"
SET "owner_receivable_amount" = "rental_fee" - "platform_fee_amount" + "delivery_fee";

ALTER TABLE "bookings"
  ALTER COLUMN "platform_fee_rate_snapshot" SET NOT NULL,
  ALTER COLUMN "platform_fee_rate_snapshot" SET DEFAULT 10,
  ALTER COLUMN "platform_fee_amount" SET NOT NULL,
  ALTER COLUMN "platform_fee_amount" SET DEFAULT 0,
  ALTER COLUMN "owner_receivable_amount" SET NOT NULL,
  ALTER COLUMN "owner_receivable_amount" SET DEFAULT 0;

ALTER TABLE "bank_accounts"
  ADD COLUMN "verification_status" "bank_account_verification_status" NOT NULL DEFAULT 'pending',
  ADD COLUMN "verified_by" BIGINT,
  ADD COLUMN "verified_at" TIMESTAMPTZ,
  ADD COLUMN "verification_reason" TEXT;

UPDATE "bank_accounts"
SET "verification_status" = 'approved'
WHERE "verified_by_admin" = TRUE;

ALTER TABLE "withdrawals"
  ADD COLUMN "transfer_proof_storage_path" TEXT,
  ADD COLUMN "transfer_proof_file_name" VARCHAR(255),
  ADD COLUMN "transfer_reference" VARCHAR(120),
  ADD COLUMN "transfer_note" TEXT,
  ADD COLUMN "transferred_at" TIMESTAMPTZ;

CREATE INDEX "bank_accounts_verification_status_idx" ON "bank_accounts"("verification_status");
CREATE INDEX "bank_accounts_verified_by_idx" ON "bank_accounts"("verified_by");

ALTER TABLE "bank_accounts"
  ADD CONSTRAINT "bank_accounts_verified_by_fkey"
  FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
