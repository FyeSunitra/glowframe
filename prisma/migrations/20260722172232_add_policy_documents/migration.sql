-- CreateEnum
CREATE TYPE "policy_document_type" AS ENUM ('terms_of_service', 'privacy_policy', 'rental_agreement', 'listing_policy', 'payment_policy', 'identity_verification_consent');

-- CreateEnum
CREATE TYPE "policy_document_status" AS ENUM ('draft', 'current', 'superseded', 'archived');

-- CreateTable
CREATE TABLE "policy_documents" (
    "id" BIGSERIAL NOT NULL,
    "type" "policy_document_type" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "version" VARCHAR(40) NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "status" "policy_document_status" NOT NULL DEFAULT 'draft',
    "force_reconsent" BOOLEAN NOT NULL DEFAULT false,
    "effective_at" TIMESTAMPTZ,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "policy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_policy_acceptances" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "policy_document_id" BIGINT NOT NULL,
    "accepted_version" VARCHAR(40) NOT NULL,
    "accepted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(80),
    "user_agent" TEXT,

    CONSTRAINT "user_policy_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "policy_documents_type_idx" ON "policy_documents"("type");

-- CreateIndex
CREATE INDEX "policy_documents_status_idx" ON "policy_documents"("status");

-- CreateIndex
CREATE INDEX "policy_documents_is_required_idx" ON "policy_documents"("is_required");

-- CreateIndex
CREATE UNIQUE INDEX "policy_documents_type_version_key" ON "policy_documents"("type", "version");

-- CreateIndex
CREATE INDEX "user_policy_acceptances_user_id_idx" ON "user_policy_acceptances"("user_id");

-- CreateIndex
CREATE INDEX "user_policy_acceptances_policy_document_id_idx" ON "user_policy_acceptances"("policy_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_policy_acceptances_user_id_policy_document_id_key" ON "user_policy_acceptances"("user_id", "policy_document_id");

-- AddForeignKey
ALTER TABLE "user_policy_acceptances" ADD CONSTRAINT "user_policy_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_policy_acceptances" ADD CONSTRAINT "user_policy_acceptances_policy_document_id_fkey" FOREIGN KEY ("policy_document_id") REFERENCES "policy_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
