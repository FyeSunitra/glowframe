ALTER TABLE "photobooth_frames"
ADD COLUMN "price" DECIMAL(10, 2);

ALTER TABLE "photobooth_frames"
ADD CONSTRAINT "photobooth_frames_price_nonnegative_check"
CHECK ("price" IS NULL OR "price" >= 0);
