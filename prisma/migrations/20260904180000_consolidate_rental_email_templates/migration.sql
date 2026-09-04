-- Rental notifications use two shared templates. Keep legacy templates for
-- historical data, but disable them because the application now uses the
-- centralized rental notification map.
UPDATE "email_templates"
SET "is_enabled" = false
WHERE "key" NOT IN ('booking_status_update', 'return_reminder');

INSERT INTO "email_templates"
  ("key", "name_th", "name_en", "subject_th", "subject_en", "body_th", "body_en", "recipient_roles")
VALUES
  (
    'booking_status_update',
    'แจ้งเตือนการเปลี่ยนสถานะรายการเช่า',
    'Rental status update',
    'อัปเดตรายการเช่า {{booking_ref}}',
    'Rental update for {{booking_ref}}',
    '<p>มีการอัปเดตสถานะรายการเช่า <strong>{{booking_ref}}</strong></p><p>กรุณาเข้าสู่ GlowFrame เพื่อดูรายละเอียด</p>',
    '<p>Your rental <strong>{{booking_ref}}</strong> has been updated.</p><p>Sign in to GlowFrame to view the details.</p>',
    ARRAY['renter', 'owner', 'admin']::TEXT[]
  ),
  (
    'return_reminder',
    'แจ้งเตือนกำหนดคืนสินค้า',
    'Return reminder',
    'ใกล้ถึงกำหนดคืนสินค้า {{booking_ref}}',
    'Your rental is due soon: {{booking_ref}}',
    '<p>รายการเช่า <strong>{{booking_ref}}</strong> มีกำหนดคืนในวันพรุ่งนี้</p><p>กรุณาเตรียมสินค้าและดำเนินการคืนตามรายละเอียด</p>',
    '<p>Your rental <strong>{{booking_ref}}</strong> is due tomorrow.</p><p>Please prepare the item and follow the return instructions.</p>',
    ARRAY['renter']::TEXT[]
  )
ON CONFLICT ("key") DO UPDATE SET
  "name_th" = EXCLUDED."name_th",
  "name_en" = EXCLUDED."name_en",
  "subject_th" = EXCLUDED."subject_th",
  "subject_en" = EXCLUDED."subject_en",
  "body_th" = EXCLUDED."body_th",
  "body_en" = EXCLUDED."body_en",
  "recipient_roles" = EXCLUDED."recipient_roles";
