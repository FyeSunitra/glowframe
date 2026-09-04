-- Keep notifications as the lightweight in-app inbox and email delivery log.
ALTER TABLE "notifications"
  ADD COLUMN "type" VARCHAR(80) NOT NULL DEFAULT 'system',
  ADD COLUMN "entity_type" VARCHAR(50),
  ADD COLUMN "entity_id" BIGINT,
  ADD COLUMN "dedupe_key" VARCHAR(255),
  ADD COLUMN "email_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN "email_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "email_last_attempt_at" TIMESTAMPTZ,
  ADD COLUMN "email_sent_at" TIMESTAMPTZ,
  ADD COLUMN "email_error" TEXT,
  ADD COLUMN "email_provider_message_id" VARCHAR(255),
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX "notifications_email_status_created_at_idx" ON "notifications"("email_status", "created_at");
