-- AlterTable
ALTER TABLE "deliveries" ADD COLUMN     "evidence_public_id" TEXT;

-- AlterTable
ALTER TABLE "product_media" ADD COLUMN     "public_id" TEXT;

-- AlterTable
ALTER TABLE "rental_returns" ADD COLUMN     "damage_evidence_public_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_image_public_id" TEXT;
