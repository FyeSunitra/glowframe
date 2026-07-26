-- CreateTable
CREATE TABLE "platform_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "platform_fee" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "min_payout" DECIMAL(12,2) NOT NULL DEFAULT 500,
    "late_fee_per_day" DECIMAL(12,2) NOT NULL DEFAULT 300,
    "min_advance_days" INTEGER NOT NULL DEFAULT 5,
    "payment_deadline_hours" INTEGER NOT NULL DEFAULT 24,
    "owner_prep_days" INTEGER NOT NULL DEFAULT 2,
    "cancellation_window_hours" INTEGER NOT NULL DEFAULT 12,
    "platform_bank_id" BIGINT,
    "platform_account_name" VARCHAR(160) NOT NULL DEFAULT 'GlowFrame Co., Ltd.',
    "platform_account_no" VARCHAR(80) NOT NULL DEFAULT '123-4-56789-0',
    "payment_review_hours" INTEGER NOT NULL DEFAULT 24,
    "payout_review_days" INTEGER NOT NULL DEFAULT 3,
    "supported_banks" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_admin_accounts" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(40) NOT NULL,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "platform_admin_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_settings_platform_bank_id_idx" ON "platform_settings"("platform_bank_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_admin_accounts_email_key" ON "platform_admin_accounts"("email");

-- CreateIndex
CREATE INDEX "platform_admin_accounts_role_idx" ON "platform_admin_accounts"("role");

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_platform_bank_id_fkey" FOREIGN KEY ("platform_bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
