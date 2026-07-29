UPDATE "policy_documents"
SET
  "title_th" = 'ข้อกำหนดการให้บริการ',
  "title_en" = 'Terms of Service',
  "body_th" = 'ข้อกำหนดนี้ครอบคลุมการสมัครและใช้งานบัญชี การจอง การชำระเงิน หน้าที่ของผู้ใช้ และสิทธิของ GlowFrame ในการดูแลความปลอดภัยของแพลตฟอร์ม ผู้ใช้ต้องให้ข้อมูลที่ถูกต้องและไม่ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย',
  "body_en" = 'These terms cover account registration and use, bookings, payments, user responsibilities, and GlowFrame''s right to maintain platform safety. Users must provide accurate information and must not use the service for unlawful purposes.'
WHERE "type" = 'terms_of_service'
  AND "version" = 'v1.0'
  AND "body_th" = 'GlowFrame Terms of Service demo content for the MVP.';

UPDATE "policy_documents"
SET
  "title_th" = 'นโยบายความเป็นส่วนตัว',
  "title_en" = 'Privacy Policy',
  "body_th" = 'GlowFrame จัดเก็บข้อมูลบัญชี การจอง การชำระเงิน และการยืนยันตัวตนเท่าที่จำเป็นต่อการให้บริการ โดยจำกัดการเข้าถึงข้อมูลส่วนบุคคลและเอกสารสำคัญตามวัตถุประสงค์และระยะเวลาที่เหมาะสม',
  "body_en" = 'GlowFrame collects account, booking, payment, and identity-verification information only as needed to provide the service. Access to personal data and sensitive documents is limited according to purpose and an appropriate retention period.'
WHERE "type" = 'privacy_policy'
  AND "version" = 'v1.0'
  AND "body_th" = 'GlowFrame Privacy Policy demo content for the MVP.';

UPDATE "policy_documents"
SET
  "title_th" = 'ข้อตกลงการเช่า',
  "title_en" = 'Rental Agreement',
  "body_th" = 'ผู้เช่าต้องดูแลสินค้า ใช้งานตามวัตถุประสงค์ คืนสินค้าตรงเวลา และแจ้งปัญหาหรือความเสียหายตามจริง เจ้าของต้องส่งมอบสินค้าตรงตามรายละเอียดและอยู่ในสภาพพร้อมใช้งาน',
  "body_en" = 'Renters must care for equipment, use it as intended, return it on time, and report issues or damage accurately. Owners must provide equipment that matches its listing and is ready for use.'
WHERE "type" = 'rental_agreement'
  AND "version" = 'v1.0'
  AND "body_th" = 'GlowFrame Rental Agreement demo content for the MVP.';

UPDATE "policy_documents"
SET
  "title_th" = 'นโยบายการลงสินค้า',
  "title_en" = 'Listing Policy',
  "body_th" = 'เจ้าของต้องยืนยันตัวตนและให้ข้อมูลสินค้า รูปภาพ ราคา สภาพ และอุปกรณ์ที่ให้มาด้วยอย่างถูกต้อง รายการสินค้าจะเผยแพร่ได้หลังผ่านการอนุมัติจากผู้ดูแลระบบ',
  "body_en" = 'Owners must verify their identity and provide accurate product details, images, pricing, condition, and included accessories. Listings become public only after admin approval.'
WHERE "type" = 'listing_policy'
  AND "version" = 'v1.0'
  AND "body_th" = 'GlowFrame Listing Policy demo content for the MVP.';

UPDATE "policy_documents"
SET
  "title_th" = 'นโยบายการชำระเงิน',
  "title_en" = 'Payment Policy',
  "body_th" = 'ผู้เช่าต้องอัปโหลดหลักฐานการชำระเงินเพื่อให้ผู้ดูแลระบบตรวจสอบ เงินค่าเช่าจะถูกถือไว้โดยแพลตฟอร์มและโอนไปยังกระเป๋าเงินของเจ้าของเมื่อรายการเสร็จสมบูรณ์ตามเงื่อนไข',
  "body_en" = 'Renters must upload payment proof for admin review. Rental funds are held by the platform and credited to the owner''s wallet after the rental is completed under the applicable conditions.'
WHERE "type" = 'payment_policy'
  AND "version" = 'v1.0'
  AND "body_th" = 'GlowFrame Payment Policy demo content for the MVP.';

UPDATE "policy_documents"
SET
  "title_th" = 'ความยินยอมในการยืนยันตัวตน',
  "title_en" = 'Identity Verification Consent',
  "body_th" = 'ผู้ใช้ยินยอมให้ GlowFrame รับและตรวจสอบเอกสารยืนยันตัวตนเพื่ออนุมัติสิทธิการลงสินค้า เอกสารจะถูกจัดเก็บในพื้นที่ส่วนตัวและจำกัดการเข้าถึงเฉพาะผู้ดูแลที่เกี่ยวข้อง',
  "body_en" = 'Users consent to GlowFrame receiving and reviewing identity documents to approve listing access. Documents are stored privately with access limited to relevant administrators.'
WHERE "type" = 'identity_verification_consent'
  AND "version" = 'v1.0'
  AND "body_th" = 'GlowFrame Identity Verification Consent demo content for the MVP.';
