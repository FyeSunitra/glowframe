import { NextRequest, NextResponse } from 'next/server'

export const REFUNDS = [
  { id: 1, refundId: 'RFD-001', txnId: 'TXN-20260712-001', user: 'Somchai P.', bookingNo: '123456-78', requested: 4700, approved: null, reason: 'Camera was damaged before rental', requestedDate: '13 Jul 2026', status: 'pending' },
  { id: 2, refundId: 'RFD-002', txnId: 'TXN-20260708-003', user: 'Pim A.', bookingNo: '345678-90', requested: 1450, approved: 1000, reason: 'Partial refund — late delivery', requestedDate: '9 Jul 2026', status: 'approved' },
  { id: 3, refundId: 'RFD-003', txnId: 'TXN-20260705-004', user: 'Teerapat W.', bookingNo: '456789-01', requested: 3050, approved: null, reason: 'Booking cancelled by owner', requestedDate: '6 Jul 2026', status: 'rejected' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const method = searchParams.get('method') ?? ''
  const tab = searchParams.get('tab') ?? 'pending'
  let result = [...REFUNDS]
  if (tab !== 'all') result = result.filter(r => r.status === tab)
  if (search) result = result.filter(r => r.refundId.includes(search) || r.bookingNo.includes(search) || r.user.toLowerCase().includes(search.toLowerCase()))
  if (method) result = result.filter(r => r.txnId.includes(method))
  return NextResponse.json({ data: result })
}
