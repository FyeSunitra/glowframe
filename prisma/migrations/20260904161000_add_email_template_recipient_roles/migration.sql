ALTER TABLE "email_templates"
  ADD COLUMN "recipient_roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "email_templates"
SET "recipient_roles" = CASE
  WHEN "key" IN ('booking_request_created', 'return_submitted', 'booking_received') THEN ARRAY['owner']::TEXT[]
  WHEN "key" IN ('payment_approved', 'payment_rejected', 'booking_preparing', 'booking_ready_for_pickup', 'booking_shipped', 'booking_completed') THEN ARRAY['renter']::TEXT[]
  ELSE ARRAY['renter']::TEXT[]
END;
