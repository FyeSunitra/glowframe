ALTER TABLE "payments"
ADD COLUMN "platform_payment_account_id" BIGINT;

CREATE INDEX "payments_platform_payment_account_id_idx"
ON "payments"("platform_payment_account_id");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_platform_payment_account_id_fkey"
FOREIGN KEY ("platform_payment_account_id") REFERENCES "platform_payment_accounts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
