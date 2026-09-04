CREATE TABLE "email_templates" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "name_th" VARCHAR(160) NOT NULL,
    "name_en" VARCHAR(160) NOT NULL,
    "subject_th" VARCHAR(255) NOT NULL,
    "subject_en" VARCHAR(255) NOT NULL,
    "body_th" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "email_templates_key_key" ON "email_templates"("key");
CREATE INDEX "email_templates_is_enabled_idx" ON "email_templates"("is_enabled");
CREATE INDEX "email_templates_updated_by_idx" ON "email_templates"("updated_by");

ALTER TABLE "email_templates"
  ADD CONSTRAINT "email_templates_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "email_templates"
  ("key", "name_th", "name_en", "subject_th", "subject_en", "body_th", "body_en")
VALUES
  ('booking_request_created', 'มีคำขอเช่าใหม่', 'New rental request', 'มีคำขอเช่าใหม่สำหรับ {{product_name}}', 'New rental request for {{product_name}}', 'สวัสดี {{user_name}}\n\nมีคำขอเช่าใหม่เลขที่ {{booking_ref}} สำหรับ {{product_name}}\nระยะเวลาเช่า: {{rental_dates}}\n\nกรุณาเข้าสู่ GlowFrame เพื่อตรวจสอบรายละเอียด', 'Hello {{user_name}},\n\nA new rental request {{booking_ref}} was submitted for {{product_name}}.\nRental period: {{rental_dates}}\n\nPlease sign in to GlowFrame to review the details.'),
  ('payment_approved', 'อนุมัติการชำระเงินแล้ว', 'Payment approved', 'การชำระเงินสำหรับ {{booking_ref}} ได้รับการอนุมัติแล้ว', 'Payment for {{booking_ref}} has been approved', 'สวัสดี {{user_name}}\n\nการชำระเงินสำหรับรายการ {{booking_ref}} ได้รับการอนุมัติแล้ว\nสินค้า: {{product_name}}\n\nเจ้าของสินค้าจะเตรียมรายการของคุณต่อไป', 'Hello {{user_name}},\n\nPayment for booking {{booking_ref}} has been approved.\nProduct: {{product_name}}\n\nThe owner will prepare your rental next.'),
  ('payment_rejected', 'ไม่อนุมัติการชำระเงิน', 'Payment rejected', 'การชำระเงินสำหรับ {{booking_ref}} ต้องดำเนินการอีกครั้ง', 'Payment for {{booking_ref}} needs attention', 'สวัสดี {{user_name}}\n\nเราไม่สามารถอนุมัติการชำระเงินสำหรับ {{booking_ref}} ได้\nเหตุผล: {{rejection_reason}}\n\nกรุณาเข้าสู่ GlowFrame เพื่อดำเนินการอีกครั้ง', 'Hello {{user_name}},\n\nWe could not approve the payment for {{booking_ref}}.\nReason: {{rejection_reason}}\n\nPlease sign in to GlowFrame to continue.'),
  ('booking_shipped', 'จัดส่งสินค้าแล้ว', 'Rental item shipped', 'สินค้าในรายการ {{booking_ref}} ถูกจัดส่งแล้ว', 'Your rental item for {{booking_ref}} has shipped', 'สวัสดี {{user_name}}\n\nสินค้าในรายการ {{booking_ref}} ถูกจัดส่งแล้ว\nเลขติดตามพัสดุ: {{tracking_number}}', 'Hello {{user_name}},\n\nYour rental item for booking {{booking_ref}} has shipped.\nTracking number: {{tracking_number}}'),
  ('return_submitted', 'ผู้เช่าแจ้งส่งคืนสินค้า', 'Renter reported a return shipment', 'ผู้เช่าแจ้งส่งคืนสินค้าในรายการ {{booking_ref}}', 'The renter reported a return shipment for {{booking_ref}}', 'สวัสดี {{user_name}}\n\nผู้เช่าแจ้งส่งคืนสินค้าในรายการ {{booking_ref}} แล้ว\nเลขติดตามพัสดุ: {{tracking_number}}\n\nกรุณาตรวจสอบเมื่อได้รับสินค้า', 'Hello {{user_name}},\n\nThe renter reported a return shipment for booking {{booking_ref}}.\nTracking number: {{tracking_number}}\n\nPlease inspect the item when it arrives.'),
  ('identity_verification_approved', 'ยืนยันตัวตนสำเร็จ', 'Identity verification approved', 'การยืนยันตัวตนของคุณสำเร็จแล้ว', 'Your identity verification is approved', 'สวัสดี {{user_name}}\n\nการยืนยันตัวตนของคุณได้รับการอนุมัติแล้ว คุณสามารถลงสินค้าเพื่อปล่อยเช่าได้', 'Hello {{user_name}},\n\nYour identity verification has been approved. You can now list products for rent.'),
  ('identity_verification_rejected', 'ไม่อนุมัติการยืนยันตัวตน', 'Identity verification rejected', 'การยืนยันตัวตนของคุณต้องดำเนินการอีกครั้ง', 'Your identity verification needs attention', 'สวัสดี {{user_name}}\n\nเราไม่สามารถอนุมัติการยืนยันตัวตนได้\nเหตุผล: {{rejection_reason}}\n\nกรุณาตรวจสอบและส่งข้อมูลใหม่', 'Hello {{user_name}},\n\nWe could not approve your identity verification.\nReason: {{rejection_reason}}\n\nPlease review and submit your information again.'),
  ('withdrawal_processed', 'ดำเนินการถอนเงินแล้ว', 'Withdrawal processed', 'คำขอถอนเงินจำนวน {{amount}} ได้รับการดำเนินการแล้ว', 'Your withdrawal of {{amount}} has been processed', 'สวัสดี {{user_name}}\n\nคำขอถอนเงินจำนวน {{amount}} ได้รับการดำเนินการแล้ว กรุณาตรวจสอบบัญชีธนาคารของคุณ', 'Hello {{user_name}},\n\nYour withdrawal of {{amount}} has been processed. Please check your bank account.')
ON CONFLICT ("key") DO NOTHING;
