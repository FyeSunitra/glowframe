-- Keep raw SQL inserts and non-Prisma writers consistent with Prisma's @updatedAt field.
ALTER TABLE "photobooth_payments"
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
