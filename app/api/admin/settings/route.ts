import { NextRequest, NextResponse } from 'next/server'

const SETTINGS = {
  fees: { platformFee: 10, minPayout: 500, lateFeePerDay: 300 },
  booking: { minAdvanceDays: 5, paymentDeadlineHours: 24, ownerPrepDays: 2, cancellationWindowHours: 12 },
  payment: {
    platformBankName: 'ธนาคารกสิกรไทย',
    platformAccountName: 'GlowFrame Co., Ltd.',
    platformAccountNo: '123-4-56789-0',
    paymentReviewHours: 24,
    payoutReviewDays: 3,
    supportedBanks: 'พร้อมเพย์, ธนาคารกสิกรไทย, ธนาคารไทยพาณิชย์, ธนาคารกรุงเทพ, ธนาคารกรุงไทย',
  },
  admins: [
    { id: 1, name: 'Admin User', email: 'admin@glowframe.com', role: 'super-admin', lastLogin: '18 Jul 2026' },
    { id: 2, name: 'Finance Team', email: 'finance@glowframe.com', role: 'finance', lastLogin: '17 Jul 2026' },
    { id: 3, name: 'Mod Team', email: 'mod@glowframe.com', role: 'moderator', lastLogin: '16 Jul 2026' },
  ],
}

export async function GET() {
  return NextResponse.json({ data: SETTINGS })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()

  if (body.section === 'fees') SETTINGS.fees = { ...SETTINGS.fees, ...body.data }
  else if (body.section === 'booking') SETTINGS.booking = { ...SETTINGS.booking, ...body.data }
  else if (body.section === 'payment') SETTINGS.payment = { ...SETTINGS.payment, ...body.data }
  else if (body.section === 'addAdmin') {
    SETTINGS.admins.push({ id: Date.now(), lastLogin: '—', ...body.data })
  } else if (body.section === 'removeAdmin') {
    const idx = SETTINGS.admins.findIndex(a => a.id === body.id)
    if (idx !== -1) SETTINGS.admins.splice(idx, 1)
  }

  return NextResponse.json({ data: SETTINGS })
}
