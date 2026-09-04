import type { BookingStatus } from '@/lib/generated/prisma/client'

export type RentalNotificationEvent =
  | 'booking_request_created'
  | 'payment_approved'
  | 'payment_rejected'
  | 'booking_preparing'
  | 'booking_shipped'
  | 'booking_received'
  | 'return_reminder'
  | 'return_submitted'
  | 'damage_reported'
  | 'damage_resolved'

export type RentalNotificationRecipient = 'renter' | 'owner' | 'admin'

export interface RentalNotificationContext {
  bookingId: bigint
  bookingNo: string
  productName: string
  renterId: bigint
  ownerId: bigint
  rentalDates?: string
  trackingNumber?: string
  rejectionReason?: string
  damageDescription?: string
  damageAmount?: string
  adminDecisionNote?: string
}

interface RentalNotificationDefinition {
  templateKey: 'booking_status_update' | 'return_reminder'
  bookingStatus: BookingStatus
  recipients: RentalNotificationRecipient[]
  message: (context: RentalNotificationContext) => {
    titleTh: string
    titleEn: string
    bodyTh: string
    bodyEn: string
  }
}

export const RENTAL_NOTIFICATION_MAP: Record<RentalNotificationEvent, RentalNotificationDefinition> = {
  booking_request_created: {
    templateKey: 'booking_status_update',
    bookingStatus: 'pending_payment_review' as BookingStatus,
    recipients: ['admin'],
    message: (c) => ({
      titleTh: `มีคำขอเช่าใหม่ ${c.bookingNo}`,
      titleEn: `New rental request ${c.bookingNo}`,
      bodyTh: `<p>มีคำขอเช่าใหม่สำหรับ <strong>${c.productName}</strong></p><p>ระยะเวลาเช่า: <strong>${c.rentalDates ?? '-'}</strong></p><p>กรุณาตรวจสอบหลักฐานการชำระเงินในระบบ</p>`,
      bodyEn: `<p>A new rental request was submitted for <strong>${c.productName}</strong>.</p><p>Rental period: <strong>${c.rentalDates ?? '-'}</strong></p><p>Please review the payment evidence in the system.</p>`,
    }),
  },
  payment_approved: {
    templateKey: 'booking_status_update',
    bookingStatus: 'payment_approved' as BookingStatus,
    recipients: ['owner'],
    message: (c) => ({
      titleTh: `อนุมัติการชำระเงิน ${c.bookingNo}`,
      titleEn: `Payment approved for ${c.bookingNo}`,
      bodyTh: `<p>การชำระเงินสำหรับรายการ <strong>${c.bookingNo}</strong> ได้รับการอนุมัติแล้ว</p><p>กรุณาเตรียมสินค้า <strong>${c.productName}</strong> ให้พร้อมสำหรับผู้เช่า</p>`,
      bodyEn: `<p>Payment for booking <strong>${c.bookingNo}</strong> has been approved.</p><p>Please prepare <strong>${c.productName}</strong> for the renter.</p>`,
    }),
  },
  payment_rejected: {
    templateKey: 'booking_status_update',
    bookingStatus: 'payment_rejected' as BookingStatus,
    recipients: ['renter'],
    message: (c) => ({
      titleTh: `หลักฐานการชำระเงินต้องตรวจสอบอีกครั้ง ${c.bookingNo}`,
      titleEn: `Payment needs attention for ${c.bookingNo}`,
      bodyTh: `<p>หลักฐานการชำระเงินสำหรับรายการ <strong>${c.bookingNo}</strong> ยังไม่สามารถอนุมัติได้</p><p>เหตุผล: <strong>${c.rejectionReason ?? '-'}</strong></p><p>กรุณาตรวจสอบและส่งหลักฐานใหม่</p>`,
      bodyEn: `<p>Payment evidence for booking <strong>${c.bookingNo}</strong> could not be approved.</p><p>Reason: <strong>${c.rejectionReason ?? '-'}</strong></p><p>Please review and submit new evidence.</p>`,
    }),
  },
  booking_preparing: {
    templateKey: 'booking_status_update',
    bookingStatus: 'preparing' as BookingStatus,
    recipients: ['renter'],
    message: (c) => ({
      titleTh: `กำลังเตรียมสินค้า ${c.bookingNo}`,
      titleEn: `Your rental is being prepared: ${c.bookingNo}`,
      bodyTh: `<p>เจ้าของกำลังเตรียมสินค้า <strong>${c.productName}</strong> สำหรับรายการเช่าของคุณ</p>`,
      bodyEn: `<p>The owner is preparing <strong>${c.productName}</strong> for your rental.</p>`,
    }),
  },
  booking_shipped: {
    templateKey: 'booking_status_update',
    bookingStatus: 'shipped' as BookingStatus,
    recipients: ['renter'],
    message: (c) => ({
      titleTh: `จัดส่งสินค้าแล้ว ${c.bookingNo}`,
      titleEn: `Your rental has shipped: ${c.bookingNo}`,
      bodyTh: `<p>สินค้า <strong>${c.productName}</strong> ถูกจัดส่งแล้ว</p><p>เลขติดตามพัสดุ: <strong>${c.trackingNumber ?? '-'}</strong></p>`,
      bodyEn: `<p><strong>${c.productName}</strong> has been shipped.</p><p>Tracking number: <strong>${c.trackingNumber ?? '-'}</strong></p>`,
    }),
  },
  booking_received: {
    templateKey: 'booking_status_update',
    bookingStatus: 'active' as BookingStatus,
    recipients: ['admin', 'owner'],
    message: (c) => ({
      titleTh: `ผู้เช่ายืนยันรับสินค้า ${c.bookingNo}`,
      titleEn: `Renter received the item: ${c.bookingNo}`,
      bodyTh: `<p>ผู้เช่ายืนยันว่าได้รับสินค้า <strong>${c.productName}</strong> แล้ว</p><p>สถานะรายการเช่าเปลี่ยนเป็นกำลังเช่า</p>`,
      bodyEn: `<p>The renter confirmed receipt of <strong>${c.productName}</strong>.</p><p>The rental is now active.</p>`,
    }),
  },
  return_reminder: {
    templateKey: 'return_reminder',
    bookingStatus: 'active' as BookingStatus,
    recipients: ['renter'],
    message: (c) => ({
      titleTh: `ใกล้ถึงกำหนดคืนสินค้า ${c.bookingNo}`,
      titleEn: `Your rental is due tomorrow: ${c.bookingNo}`,
      bodyTh: `<p>สินค้า <strong>${c.productName}</strong> มีกำหนดคืนในวันพรุ่งนี้</p><p>กรุณาเตรียมสินค้าและดำเนินการคืนตามรายละเอียดในรายการเช่า</p>`,
      bodyEn: `<p>Your rental item <strong>${c.productName}</strong> is due tomorrow.</p><p>Please prepare the item and follow the return instructions in your booking.</p>`,
    }),
  },
  return_submitted: {
    templateKey: 'booking_status_update',
    bookingStatus: 'return_pending' as BookingStatus,
    recipients: ['admin', 'owner'],
    message: (c) => ({
      titleTh: `ผู้เช่าแจ้งส่งคืนสินค้า ${c.bookingNo}`,
      titleEn: `Renter reported a return: ${c.bookingNo}`,
      bodyTh: `<p>ผู้เช่าแจ้งส่งคืนสินค้า <strong>${c.productName}</strong> แล้ว</p><p>เลขติดตามพัสดุ: <strong>${c.trackingNumber ?? '-'}</strong></p><p>กรุณาตรวจสอบเมื่อได้รับสินค้า</p>`,
      bodyEn: `<p>The renter reported a return shipment for <strong>${c.productName}</strong>.</p><p>Tracking number: <strong>${c.trackingNumber ?? '-'}</strong></p><p>Please inspect the item when it arrives.</p>`,
    }),
  },
  damage_reported: {
    templateKey: 'booking_status_update',
    bookingStatus: 'disputed' as BookingStatus,
    recipients: ['admin'],
    message: (c) => ({
      titleTh: `แจ้งความเสียหาย ${c.bookingNo}`,
      titleEn: `Damage reported for ${c.bookingNo}`,
      bodyTh: `<p>พบความเสียหายของสินค้า <strong>${c.productName}</strong></p><p>รายละเอียด: <strong>${c.damageDescription ?? '-'}</strong></p><p>ยอดโดยประมาณ: <strong>${c.damageAmount ?? '-'}</strong></p>`,
      bodyEn: `<p>Damage was reported for <strong>${c.productName}</strong>.</p><p>Details: <strong>${c.damageDescription ?? '-'}</strong></p><p>Estimated amount: <strong>${c.damageAmount ?? '-'}</strong></p>`,
    }),
  },
  damage_resolved: {
    templateKey: 'booking_status_update',
    bookingStatus: 'completed' as BookingStatus,
    recipients: ['renter', 'owner'],
    message: (c) => ({
      titleTh: `แอดมินจัดการรายการ ${c.bookingNo} แล้ว`,
      titleEn: `Admin resolved booking ${c.bookingNo}`,
      bodyTh: `<p>แอดมินดำเนินการเรื่องความเสียหายของ <strong>${c.productName}</strong> แล้ว</p><p>ผลการดำเนินการ: <strong>${c.adminDecisionNote ?? '-'}</strong></p>`,
      bodyEn: `<p>Admin resolved the damage review for <strong>${c.productName}</strong>.</p><p>Resolution: <strong>${c.adminDecisionNote ?? '-'}</strong></p>`,
    }),
  },
}
