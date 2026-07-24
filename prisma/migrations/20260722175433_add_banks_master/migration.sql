-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "bank_id" BIGINT;

-- CreateTable
CREATE TABLE "banks" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "abbreviation" VARCHAR(30) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banks_code_key" ON "banks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "banks_abbreviation_key" ON "banks"("abbreviation");

-- CreateIndex
CREATE INDEX "banks_name_idx" ON "banks"("name");

-- CreateIndex
CREATE INDEX "banks_is_active_idx" ON "banks"("is_active");

-- CreateIndex
CREATE INDEX "bank_accounts_bank_id_idx" ON "bank_accounts"("bank_id");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
