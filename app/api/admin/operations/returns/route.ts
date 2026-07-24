import { NextRequest, NextResponse } from 'next/server'

export const PENDING_RETURNS = [
  { id: 1, bookingNo: '123456-78', camera: { name: 'Canon EOS R5', color: '#F3C9D2' }, renter: 'Somchai P.', owner: 'Narin K.', dueDate: '17 Jul 2026', delivery: 'grab', status: 'awaiting-return' },
  { id: 2, bookingNo: '234567-89', camera: { name: 'Sony A7 IV', color: '#D9E7F2' }, renter: 'Ploy S.', owner: 'Teerapat W.', dueDate: '12 Jul 2026', delivery: 'pickup', status: 'overdue' },
]

export const CONDITION_REPORTS = [
  { id: 1, reportId: 'RPT-001', bookingNo: '099001-11', camera: 'Canon EOS R5', condition: 'intact', reportedBy: 'Narin K.', photos: 3, reported: '11 Jul 2026', claimStatus: 'none' },
  { id: 2, reportId: 'RPT-002', bookingNo: '088002-22', camera: 'Sony A7 IV', condition: 'minor-damage', reportedBy: 'Ploy S.', photos: 5, reported: '9 Jul 2026', claimStatus: 'open' },
  { id: 3, reportId: 'RPT-003', bookingNo: '077003-33', camera: 'Fujifilm X-T5', condition: 'major-damage', reportedBy: 'Somchai P.', photos: 8, reported: '6 Jul 2026', claimStatus: 'resolved' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') ?? 'pending'
  const search = searchParams.get('search') ?? ''
  const condition = searchParams.get('condition') ?? ''
  if (tab === 'pending') {
    let result = [...PENDING_RETURNS]
    if (search) result = result.filter(r => r.bookingNo.includes(search) || r.renter.toLowerCase().includes(search.toLowerCase()))
    return NextResponse.json({ data: result })
  }
  let result = [...CONDITION_REPORTS]
  if (search) result = result.filter(r => r.reportId.includes(search) || r.bookingNo.includes(search))
  if (condition) result = result.filter(r => r.condition === condition)
  return NextResponse.json({ data: result })
}
