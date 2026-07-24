import { NextRequest, NextResponse } from 'next/server'

export const REPORTS = [
  { id: 1, reporter: 'Somchai P.', entity: 'Fake Canon listing', entityType: 'listing', reason: 'fake-listing', details: 'The camera photos are stock images. Contacted seller and got no response.', submitted: '16 Jul 2026', status: 'open' },
  { id: 2, reporter: 'Ploy S.', entity: 'Narin K.', entityType: 'user', reason: 'scam', details: 'Requested deposit outside the platform.', submitted: '15 Jul 2026', status: 'open' },
  { id: 3, reporter: 'Pim A.', entity: 'Sony A7 listing', entityType: 'listing', reason: 'fraud', details: 'Item was never sent. Tracking number is fake.', submitted: '12 Jul 2026', status: 'resolved' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const reason = searchParams.get('reason') ?? ''
  const status = searchParams.get('status') ?? ''
  let result = [...REPORTS]
  if (search) result = result.filter(r => r.reporter.toLowerCase().includes(search.toLowerCase()) || r.entity.toLowerCase().includes(search.toLowerCase()))
  if (reason) result = result.filter(r => r.reason === reason)
  if (status) result = result.filter(r => r.status === status)
  return NextResponse.json({ data: result })
}
