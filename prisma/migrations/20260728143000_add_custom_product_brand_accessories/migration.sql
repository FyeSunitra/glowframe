ALTER TABLE "products"
ALTER COLUMN "brand_id" DROP NOT NULL,
ADD COLUMN "custom_brand_name" VARCHAR(120);

ALTER TABLE "products"
ADD CONSTRAINT "products_brand_choice_check"
CHECK (
  ("brand_id" IS NOT NULL AND "custom_brand_name" IS NULL)
  OR
  ("brand_id" IS NULL AND NULLIF(BTRIM("custom_brand_name"), '') IS NOT NULL)
);

CREATE TABLE "product_custom_accessories" (
  "id" BIGSERIAL NOT NULL,
  "product_id" BIGINT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "sort_order" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "product_custom_accessories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_custom_accessories_quantity_check" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX "product_custom_accessories_product_id_name_key"
ON "product_custom_accessories"("product_id", "name");

CREATE INDEX "product_custom_accessories_product_id_idx"
ON "product_custom_accessories"("product_id");

ALTER TABLE "product_custom_accessories"
ADD CONSTRAINT "product_custom_accessories_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
