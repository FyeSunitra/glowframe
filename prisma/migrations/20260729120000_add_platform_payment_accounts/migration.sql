-- Add a repeatable list of platform receiving accounts without removing legacy settings columns.
CREATE TABLE "platform_payment_accounts" (
    "id" BIGSERIAL NOT NULL,
    "setting_id" INTEGER NOT NULL,
    "bank_id" BIGINT NOT NULL,
    "account_name" VARCHAR(160) NOT NULL,
    "account_number" VARCHAR(80) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_payment_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "platform_payment_accounts_setting_id_is_active_sort_order_idx"
ON "platform_payment_accounts"("setting_id", "is_active", "sort_order");

CREATE INDEX "platform_payment_accounts_bank_id_idx"
ON "platform_payment_accounts"("bank_id");

ALTER TABLE "platform_payment_accounts"
ADD CONSTRAINT "platform_payment_accounts_setting_id_fkey"
FOREIGN KEY ("setting_id") REFERENCES "platform_settings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "platform_payment_accounts"
ADD CONSTRAINT "platform_payment_accounts_bank_id_fkey"
FOREIGN KEY ("bank_id") REFERENCES "banks"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "platform_payment_accounts" (
    "setting_id",
    "bank_id",
    "account_name",
    "account_number",
    "is_active",
    "sort_order",
    "updated_at"
)
SELECT
    "id",
    "platform_bank_id",
    "platform_account_name",
    "platform_account_no",
    true,
    0,
    CURRENT_TIMESTAMP
FROM "platform_settings"
WHERE "platform_bank_id" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM "platform_payment_accounts"
      WHERE "platform_payment_accounts"."setting_id" = "platform_settings"."id"
  );
