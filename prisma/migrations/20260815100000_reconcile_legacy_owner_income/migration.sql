WITH "legacy_income_adjustments" AS (
  SELECT
    "wallet_entries"."wallet_id",
    SUM("bookings"."owner_receivable_amount" - "wallet_entries"."amount") AS "balance_adjustment"
  FROM "wallet_entries"
  INNER JOIN "bookings" ON "bookings"."id" = "wallet_entries"."booking_id"
  WHERE
    "wallet_entries"."entry_type" = 'rental_income'
    AND "wallet_entries"."amount" = "bookings"."rental_fee"
  GROUP BY "wallet_entries"."wallet_id"
)
UPDATE "wallets"
SET "simulated_balance" = "wallets"."simulated_balance" + "legacy_income_adjustments"."balance_adjustment"
FROM "legacy_income_adjustments"
WHERE "wallets"."id" = "legacy_income_adjustments"."wallet_id";

UPDATE "wallet_entries"
SET
  "amount" = "bookings"."owner_receivable_amount",
  "description" = 'Owner receivable after platform fee and delivery allocation'
FROM "bookings"
WHERE
  "wallet_entries"."booking_id" = "bookings"."id"
  AND "wallet_entries"."entry_type" = 'rental_income'
  AND "wallet_entries"."amount" = "bookings"."rental_fee";
