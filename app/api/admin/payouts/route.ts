import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_PAYOUTS_PENDING = [
  { id: 1, owner: { displayName: 'Somchai P.', email: 'somchai@example.com' }, bookingNo: '123456-78', bookingTotal: 4700, platformFee: 470, payoutAmount: 4230, bank: 'Kasikorn Bank', accountNo: '***-4-56789', requestedAt: '18 Jul 2026', status: 'pending' },
  { id: 2, owner: { displayName: 'Narin K.', email: 'narin@example.com' }, bookingNo: '345678-90', bookingTotal: 1450, platformFee: 145, payoutAmount: 1305, bank: 'SCB', accountNo: '***-2-23456', requestedAt: '17 Jul 2026', status: 'pending' },
  { id: 3, owner: { displayName: 'Pim A.', email: 'pim@example.com' }, bookingNo: '567890-12', bookingTotal: 2100, platformFee: 210, payoutAmount: 1890, bank: 'Bangkok Bank', accountNo: '***-8-78901', requestedAt: '16 Jul 2026', status: 'pending' },
]

export const ADMIN_PAYOUTS_HISTORY = [
  { id: 4, owner: { displayName: 'Somchai P.', email: 'somchai@example.com' }, bookingNo: '099001-11', bookingTotal: 3600, platformFee: 360, payoutAmount: 3240, bank: 'Kasikorn Bank', accountNo: '***-4-56789', requestedAt: '10 Jul 2026', status: 'approved' },
  { id: 5, owner: { displayName: 'Ploy S.', email: 'ploy@example.com' }, bookingNo: '088002-22', bookingTotal: 2800, platformFee: 280, payoutAmount: 2520, bank: 'Krungthai Bank', accountNo: '***-9-12345', requestedAt: '8 Jul 2026', status: 'approved' },
  { id: 6, owner: { displayName: 'Teerapat W.', email: 'teerapat@example.com' }, bookingNo: '077003-33', bookingTotal: 1800, platformFee: 180, payoutAmount: 1620, bank: 'SCB', accountNo: '***-7-67890', requestedAt: '5 Jul 2026', status: 'rejected' },
]

export async function GET(req: NextRequest) {
  const tab = new URL(req.url).searchParams.get('tab') ?? 'pending'
  const data = tab === 'history' ? ADMIN_PAYOUTS_HISTORY : ADMIN_PAYOUTS_PENDING
  const stats = {
    totalPaid: ADMIN_PAYOUTS_HISTORY.filter(p => p.status === 'approved').reduce((s, p) => s + p.payoutAmount, 0),
    pendingCount: ADMIN_PAYOUTS_PENDING.length,
    thisMonth: 32100,
  }
  return NextResponse.json({ data, stats })
}
