CREATE TYPE "photobooth_payment_status" AS ENUM (
    'pending',
    'succeeded',
    'failed',
    'expired',
    'cancelled'
);

CREATE TABLE "photobooth_payments" (
    "id" BIGSERIAL NOT NULL,
    "frame_id" BIGINT NOT NULL,
    "user_id" BIGINT,
    "guest_session_id" UUID NOT NULL,
    "reference_id" VARCHAR(100) NOT NULL,
    "beam_charge_id" VARCHAR(100),
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'THB',
    "status" "photobooth_payment_status" NOT NULL DEFAULT 'pending',
    "failure_code" VARCHAR(120),
    "qr_expires_at" TIMESTAMPTZ,
    "access_expires_at" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photobooth_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "photobooth_payments_amount_positive_check" CHECK ("amount" > 0),
    CONSTRAINT "photobooth_payments_currency_check" CHECK ("currency" = 'THB'),
    CONSTRAINT "photobooth_payments_frame_id_fkey"
        FOREIGN KEY ("frame_id") REFERENCES "photobooth_frames"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "photobooth_payments_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "photobooth_payments_reference_id_key"
ON "photobooth_payments"("reference_id");

CREATE UNIQUE INDEX "photobooth_payments_beam_charge_id_key"
ON "photobooth_payments"("beam_charge_id");

CREATE INDEX "photobooth_payments_frame_id_status_idx"
ON "photobooth_payments"("frame_id", "status");

CREATE INDEX "photobooth_payments_guest_session_id_status_idx"
ON "photobooth_payments"("guest_session_id", "status");

CREATE INDEX "photobooth_payments_user_id_idx"
ON "photobooth_payments"("user_id");

CREATE INDEX "photobooth_payments_qr_expires_at_idx"
ON "photobooth_payments"("qr_expires_at");

CREATE INDEX "photobooth_payments_access_expires_at_idx"
ON "photobooth_payments"("access_expires_at");
