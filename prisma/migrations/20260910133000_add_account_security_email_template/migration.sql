INSERT INTO "email_templates"
  ("key", "name_th", "name_en", "subject_th", "subject_en", "body_th", "body_en", "recipient_roles")
VALUES
  (
    'account_security_update',
    'การแจ้งเตือนบัญชีและความปลอดภัย',
    'Account and security update',
    '{{verification_type}}{{verification_status}}',
    '{{verification_type}}: {{verification_status}}',
    '<p>เรียน {{user_name}}</p><p>ผลการตรวจสอบ{{verification_type}}ของคุณคือ <strong>{{verification_status}}</strong></p><p>{{rejection_reason}}</p><p>กรุณาเข้าสู่ระบบ GlowFrame เพื่อดูรายละเอียดเพิ่มเติม</p>',
    '<p>Hello {{user_name}},</p><p>Your {{verification_type}} review result is <strong>{{verification_status}}</strong>.</p><p>{{rejection_reason}}</p><p>Please sign in to GlowFrame to view more details.</p>',
    ARRAY['renter', 'owner']::TEXT[]
  )
ON CONFLICT ("key") DO UPDATE SET
  "name_th" = EXCLUDED."name_th",
  "name_en" = EXCLUDED."name_en",
  "subject_th" = EXCLUDED."subject_th",
  "subject_en" = EXCLUDED."subject_en",
  "body_th" = EXCLUDED."body_th",
  "body_en" = EXCLUDED."body_en",
  "recipient_roles" = EXCLUDED."recipient_roles";
