import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_TRANSACTIONS = [
  { id: 1, txnId: 'TXN-20260712-001', bookingNo: '123456-78', user: { displayName: 'Somchai P.', email: 'somchai@example.com' }, method: 'qr', rentalFee: 4500, deliveryFee: 200, deposit: 5000, total: 9700, platformFee: 470, date: '12 Jul 2026', status: 'paid', proofFile: 'transfer-123456-78.jpg' },
  { id: 2, txnId: 'TXN-20260710-002', bookingNo: '234567-89', user: { displayName: 'Ploy S.', email: 'ploy@example.com' }, method: 'qr', rentalFee: 2400, deliveryFee: 0, deposit: 4500, total: 6900, platformFee: 240, date: '10 Jul 2026', status: 'pending_review', proofFile: 'payment-proof-234567-89.png' },
  { id: 3, txnId: 'TXN-20260708-003', bookingNo: '345678-90', user: { displayName: 'Pim A.', email: 'pim@example.com' }, method: 'qr', rentalFee: 1300, deliveryFee: 150, total: 1450, platformFee: 145, date: '8 Jul 2026', status: 'paid' },
  { id: 4, txnId: 'TXN-20260705-004', bookingNo: '456789-01', user: { displayName: 'Teerapat W.', email: 'teerapat@example.com' }, method: 'qr', rentalFee: 2850, deliveryFee: 200, total: 3050, platformFee: 305, date: '5 Jul 2026', status: 'refunded' },
  { id: 5, txnId: 'TXN-20260701-005', bookingNo: '567890-12', user: { displayName: 'Narin K.', email: 'narin@example.com' }, method: 'card', rentalFee: 1900, deliveryFee: 200, total: 2100, platformFee: 210, date: '1 Jul 2026', status: 'paid' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const method = searchParams.get('method') ?? ''
  const status = searchParams.get('status') ?? ''

  let result = [...ADMIN_TRANSACTIONS]
  if (search) result = result.filter(t => t.txnId.toLowerCase().includes(search.toLowerCase()) || t.bookingNo.includes(search))
  if (method) result = result.filter(t => t.method === method)
  if (status) result = result.filter(t => t.status === status)

  return NextResponse.json({ data: result })
}
