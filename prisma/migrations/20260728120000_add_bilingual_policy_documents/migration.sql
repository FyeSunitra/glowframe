-- Preserve the existing document content as the Thai copy.
ALTER TABLE "policy_documents" RENAME COLUMN "title" TO "title_th";
ALTER TABLE "policy_documents" RENAME COLUMN "body" TO "body_th";

-- Backfill the new English copy before making it required.
ALTER TABLE "policy_documents"
ADD COLUMN "title_en" VARCHAR(160),
ADD COLUMN "body_en" TEXT;

UPDATE "policy_documents"
SET
  "title_en" = "title_th",
  "body_en" = "body_th";

ALTER TABLE "policy_documents"
ALTER COLUMN "title_en" SET NOT NULL,
ALTER COLUMN "body_en" SET NOT NULL;

ALTER TABLE "policy_documents" DROP COLUMN "summary";
