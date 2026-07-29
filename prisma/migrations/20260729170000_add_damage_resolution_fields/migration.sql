ALTER TABLE "rental_returns"
ADD COLUMN "approved_damage_amount" NUMERIC(12, 2),
ADD COLUMN "admin_decision_note" TEXT;
