INSERT INTO "email_templates"
  ("key", "name_th", "name_en", "subject_th", "subject_en", "body_th", "body_en", "recipient_roles", "created_at", "updated_at")
VALUES
  (
    'admin_review_required',
    'แจ้งเตือนรายการรอตรวจสอบ',
    'Review required notification',
    'มี{{request_type}}รอตรวจสอบ',
    'A {{request_type}} requires review',
    '<p>เรียน {{user_name}}</p><p>มี<strong>{{request_type}}</strong>จาก {{requester_name}} รอตรวจสอบ</p><p>รายการ: <strong>{{request_reference}}</strong></p><p>จำนวนเงิน: <strong>{{request_amount}}</strong></p><p>กรุณาเข้าสู่ GlowFrame เพื่อตรวจสอบรายละเอียด</p>',
    '<p>Hello {{user_name}},</p><p>A <strong>{{request_type}}</strong> from {{requester_name}} requires your review.</p><p>Reference: <strong>{{request_reference}}</strong></p><p>Amount: <strong>{{request_amount}}</strong></p><p>Please sign in to GlowFrame to review the details.</p>',
    ARRAY['admin']::TEXT[],
    NOW(),
    NOW()
  )
ON CONFLICT ("key") DO UPDATE SET
  "name_th" = EXCLUDED."name_th",
  "name_en" = EXCLUDED."name_en",
  "subject_th" = EXCLUDED."subject_th",
  "subject_en" = EXCLUDED."subject_en",
  "body_th" = EXCLUDED."body_th",
  "body_en" = EXCLUDED."body_en",
  "recipient_roles" = EXCLUDED."recipient_roles";
