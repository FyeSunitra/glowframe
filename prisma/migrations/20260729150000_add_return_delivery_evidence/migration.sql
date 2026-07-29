ALTER TABLE "rental_returns"
ADD COLUMN "return_method" "delivery_method",
ADD COLUMN "return_provider_name" VARCHAR(120),
ADD COLUMN "return_note" TEXT,
ADD COLUMN "return_evidence_url" TEXT,
ADD COLUMN "return_evidence_public_id" TEXT;
