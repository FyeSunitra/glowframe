import { NextRequest, NextResponse } from 'next/server'

export const PDPA_REQUESTS = [
  { id: 1, requestId: 'PDPA-001', user: { displayName: 'Somchai P.', email: 'somchai@example.com' }, type: 'access', submitted: '10 Jul 2026', dueDate: '9 Aug 2026', status: 'pending' },
  { id: 2, requestId: 'PDPA-002', user: { displayName: 'Narin K.', email: 'narin@example.com' }, type: 'erasure', submitted: '5 Jul 2026', dueDate: '4 Aug 2026', status: 'in-progress' },
  { id: 3, requestId: 'PDPA-003', user: { displayName: 'Ploy S.', email: 'ploy@example.com' }, type: 'portability', submitted: '1 Jun 2026', dueDate: '1 Jul 2026', status: 'completed' },
  { id: 4, requestId: 'PDPA-004', user: { displayName: 'Pim A.', email: 'pim@example.com' }, type: 'objection', submitted: '1 Jul 2026', dueDate: '31 Jul 2026', status: 'pending' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const type = searchParams.get('type') ?? ''
  const status = searchParams.get('status') ?? ''
  let result = [...PDPA_REQUESTS]
  if (search) result = result.filter(r => r.requestId.includes(search) || r.user.displayName.toLowerCase().includes(search.toLowerCase()))
  if (type) result = result.filter(r => r.type === type)
  if (status) result = result.filter(r => r.status === status)
  return NextResponse.json({ data: result })
}
