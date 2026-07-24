import { NextRequest, NextResponse } from 'next/server'

export const DISPUTES = [
  { id: 1, disputeId: 'DSP-001', bookingNo: '123456-78', openedBy: 'renter', type: 'damage', claimAmount: 3000, opened: '15 Jul 2026', status: 'pending' },
  { id: 2, disputeId: 'DSP-002', bookingNo: '234567-89', openedBy: 'owner', type: 'late-return', claimAmount: 800, opened: '14 Jul 2026', status: 'in-review' },
  { id: 3, disputeId: 'DSP-003', bookingNo: '345678-90', openedBy: 'renter', type: 'mismatch', claimAmount: 2400, opened: '10 Jul 2026', status: 'resolved' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const type = searchParams.get('type') ?? ''
  const tab = searchParams.get('tab') ?? 'pending'
  let result = [...DISPUTES]
  if (tab === 'pending') result = result.filter(d => d.status === 'pending')
  else if (tab === 'in-review') result = result.filter(d => d.status === 'in-review')
  else if (tab === 'resolved') result = result.filter(d => d.status === 'resolved')
  if (search) result = result.filter(d => d.disputeId.includes(search) || d.bookingNo.includes(search))
  if (type) result = result.filter(d => d.type === type)
  return NextResponse.json({ data: result })
}
