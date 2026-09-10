ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

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
);

ALTER PUBLICATION supabase_realtime ADD TABLE "notifications";
