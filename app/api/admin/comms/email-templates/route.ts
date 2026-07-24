import { NextResponse } from 'next/server'

export const EMAIL_TEMPLATES = [
  { id: 1, key: 'welcome', name: 'Welcome', subject: 'Welcome to GlowFrame, {{user_name}}!', lastEdited: '1 Jun 2026', lastEditedBy: 'Admin' },
  { id: 2, key: 'booking_confirmed', name: 'Booking Confirmed', subject: 'Your booking #{{booking_ref}} is confirmed', lastEdited: '10 Jun 2026', lastEditedBy: 'Admin' },
  { id: 3, key: 'booking_cancelled', name: 'Booking Cancelled', subject: 'Booking #{{booking_ref}} has been cancelled', lastEdited: '10 Jun 2026', lastEditedBy: 'Admin' },
  { id: 4, key: 'booking_reminder', name: 'Booking Reminder', subject: 'Your rental starts tomorrow — booking #{{booking_ref}}', lastEdited: '15 Jun 2026', lastEditedBy: 'Admin' },
  { id: 5, key: 'payout_processed', name: 'Payout Processed', subject: 'Your payout of ฿{{amount}} has been sent', lastEdited: '15 Jun 2026', lastEditedBy: 'Admin' },
  { id: 6, key: 'id_verification_approved', name: 'ID Verified', subject: 'Your identity has been verified', lastEdited: '1 Jul 2026', lastEditedBy: 'Admin' },
  { id: 7, key: 'id_verification_rejected', name: 'ID Rejected', subject: 'We could not verify your identity', lastEdited: '1 Jul 2026', lastEditedBy: 'Admin' },
  { id: 8, key: 'account_suspended', name: 'Account Suspended', subject: 'Your GlowFrame account has been suspended', lastEdited: '5 Jul 2026', lastEditedBy: 'Admin' },
  { id: 9, key: 'password_reset', name: 'Password Reset', subject: 'Reset your GlowFrame password', lastEdited: '5 Jul 2026', lastEditedBy: 'Admin' },
]

export async function GET() {
  return NextResponse.json({ data: EMAIL_TEMPLATES })
}
