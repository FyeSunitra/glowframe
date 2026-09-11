ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- The Prisma shadow database does not include Supabase Auth or Realtime.
-- Keep those integrations on Supabase while allowing standard PostgreSQL
-- shadow databases to validate the rest of the migration history.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE $policy$
      CREATE POLICY "Users can receive their own notifications"
      ON "notifications"
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM "users"
          WHERE "users"."id" = "notifications"."user_id"
            AND "users"."auth_user_id" = auth.uid()
        )
      )
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "notifications";
  END IF;
END $$;
