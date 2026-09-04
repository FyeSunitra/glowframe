-- Email templates are rendered as HTML. Keep the text stored in the database
-- semantic so admins can safely edit it in the template editor.
UPDATE "email_templates" AS template
SET
  "body_th" = data.body_th,
  "body_en" = data.body_en,
  "recipient_roles" = data.recipient_roles
FROM (
  VALUES
    (
      'booking_request_created',
      ARRAY['owner']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>มีคำขอเช่าใหม่เลขที่ <strong>{{booking_ref}}</strong> สำหรับ <strong>{{product_name}}</strong></p><p>ระยะเวลาเช่า: <strong>{{rental_dates}}</strong></p><p>กรุณาเข้าสู่ GlowFrame เพื่อตรวจสอบรายละเอียด</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>A new rental request <strong>{{booking_ref}}</strong> was submitted for <strong>{{product_name}}</strong>.</p><p>Rental period: <strong>{{rental_dates}}</strong></p><p>Please sign in to GlowFrame to review the details.</p>$en$
    ),
    (
      'payment_approved',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>การชำระเงินสำหรับรายการ <strong>{{booking_ref}}</strong> ได้รับการอนุมัติแล้ว</p><p>สินค้า: <strong>{{product_name}}</strong></p><p>เจ้าของสินค้าจะเตรียมรายการของคุณต่อไป</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>Payment for booking <strong>{{booking_ref}}</strong> has been approved.</p><p>Product: <strong>{{product_name}}</strong></p><p>The owner will prepare your rental next.</p>$en$
    ),
    (
      'payment_rejected',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>เราไม่สามารถอนุมัติการชำระเงินสำหรับ <strong>{{booking_ref}}</strong> ได้</p><p>เหตุผล: <strong>{{rejection_reason}}</strong></p><p>กรุณาเข้าสู่ GlowFrame เพื่อดำเนินการอีกครั้ง</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>We could not approve the payment for <strong>{{booking_ref}}</strong>.</p><p>Reason: <strong>{{rejection_reason}}</strong></p><p>Please sign in to GlowFrame to continue.</p>$en$
    ),
    (
      'booking_preparing',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>เจ้าของกำลังเตรียมสินค้า <strong>{{product_name}}</strong> สำหรับรายการ <strong>{{booking_ref}}</strong></p>$th$,
      $en$<p>Hello {{user_name}},</p><p>The owner is preparing <strong>{{product_name}}</strong> for booking <strong>{{booking_ref}}</strong>.</p>$en$
    ),
    (
      'booking_ready_for_pickup',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>สินค้า <strong>{{product_name}}</strong> พร้อมให้รับแล้วสำหรับรายการ <strong>{{booking_ref}}</strong></p><p>กรุณาเข้าสู่ GlowFrame เพื่อตรวจสอบรายละเอียดการรับสินค้า</p>$th$,
      $en$<p>Hello {{user_name}},</p><p><strong>{{product_name}}</strong> is ready for pickup for booking <strong>{{booking_ref}}</strong>.</p><p>Please sign in to GlowFrame for pickup details.</p>$en$
    ),
    (
      'booking_shipped',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>สินค้าในรายการ <strong>{{booking_ref}}</strong> ถูกจัดส่งแล้ว</p><p>เลขติดตามพัสดุ: <strong>{{tracking_number}}</strong></p>$th$,
      $en$<p>Hello {{user_name}},</p><p>Your rental item for booking <strong>{{booking_ref}}</strong> has shipped.</p><p>Tracking number: <strong>{{tracking_number}}</strong></p>$en$
    ),
    (
      'booking_received',
      ARRAY['owner']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>ผู้เช่ายืนยันว่าได้รับสินค้า <strong>{{product_name}}</strong> ในรายการ <strong>{{booking_ref}}</strong> แล้ว</p><p>รายการเช่าเริ่มต้นแล้ว</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>The renter confirmed receipt of <strong>{{product_name}}</strong> for booking <strong>{{booking_ref}}</strong>.</p><p>The rental is now active.</p>$en$
    ),
    (
      'return_submitted',
      ARRAY['owner']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>ผู้เช่าแจ้งส่งคืนสินค้าในรายการ <strong>{{booking_ref}}</strong> แล้ว</p><p>เลขติดตามพัสดุ: <strong>{{tracking_number}}</strong></p><p>กรุณาตรวจสอบสินค้าเมื่อได้รับคืน</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>The renter reported a return shipment for booking <strong>{{booking_ref}}</strong>.</p><p>Tracking number: <strong>{{tracking_number}}</strong></p><p>Please inspect the item when it arrives.</p>$en$
    ),
    (
      'booking_completed',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>เจ้าของยืนยันรับคืนสินค้า <strong>{{product_name}}</strong> แล้ว</p><p>รายการเช่า <strong>{{booking_ref}}</strong> เสร็จสิ้นแล้ว</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>The owner confirmed the returned <strong>{{product_name}}</strong>.</p><p>Booking <strong>{{booking_ref}}</strong> is complete.</p>$en$
    ),
    (
      'identity_verification_approved',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>การยืนยันตัวตนของคุณได้รับการอนุมัติแล้ว</p><p>คุณสามารถลงสินค้าเพื่อปล่อยเช่าได้</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>Your identity verification has been approved.</p><p>You can now list products for rent.</p>$en$
    ),
    (
      'identity_verification_rejected',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>เราไม่สามารถอนุมัติการยืนยันตัวตนได้</p><p>เหตุผล: <strong>{{rejection_reason}}</strong></p><p>กรุณาตรวจสอบและส่งข้อมูลใหม่</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>We could not approve your identity verification.</p><p>Reason: <strong>{{rejection_reason}}</strong></p><p>Please review and submit your information again.</p>$en$
    ),
    (
      'withdrawal_processed',
      ARRAY['renter']::TEXT[],
      $th$<p>สวัสดี {{user_name}}</p><p>คำขอถอนเงินจำนวน <strong>{{amount}}</strong> ได้รับการดำเนินการแล้ว</p><p>กรุณาตรวจสอบบัญชีธนาคารของคุณ</p>$th$,
      $en$<p>Hello {{user_name}},</p><p>Your withdrawal of <strong>{{amount}}</strong> has been processed.</p><p>Please check your bank account.</p>$en$
    )
) AS data("key", recipient_roles, body_th, body_en)
WHERE template."key" = data."key";
