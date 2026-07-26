-- Authentication credentials and OAuth identities are owned by Supabase Auth.
DROP INDEX IF EXISTS "users_google_sub_idx";
DROP INDEX IF EXISTS "users_google_sub_key";

ALTER TABLE "users"
  DROP COLUMN IF EXISTS "password_hash",
  DROP COLUMN IF EXISTS "google_sub";
