-- This migration predates the migration that creates photobooth_payments.
-- Guard the legacy alteration so a clean shadow database can replay the history.
DO $$
BEGIN
  IF to_regclass('public.photobooth_payments') IS NOT NULL THEN
    ALTER TABLE "photobooth_payments"
      ALTER COLUMN "updated_at" DROP DEFAULT;
  END IF;
END
$$;
