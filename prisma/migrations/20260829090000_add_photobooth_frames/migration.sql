CREATE TABLE "photobooth_frames" (
    "id" BIGSERIAL NOT NULL,
    "name_th" VARCHAR(160) NOT NULL,
    "name_en" VARCHAR(160) NOT NULL,
    "description_th" TEXT,
    "description_en" TEXT,
    "canvas_width" INTEGER NOT NULL,
    "canvas_height" INTEGER NOT NULL,
    "aspect_ratio_label" VARCHAR(20),
    "frame_count" INTEGER NOT NULL,
    "slot_config" JSONB NOT NULL,
    "overlay_url" TEXT NOT NULL,
    "overlay_public_id" TEXT NOT NULL,
    "original_file_name" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "photobooth_frames_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "photobooth_frames_overlay_public_id_key"
ON "photobooth_frames"("overlay_public_id");

CREATE INDEX "photobooth_frames_is_active_sort_order_idx"
ON "photobooth_frames"("is_active", "sort_order");

CREATE INDEX "photobooth_frames_created_at_idx"
ON "photobooth_frames"("created_at");
