import { NextRequest, NextResponse } from 'next/server'

export const KYC_QUEUE = [
  { id: 1, user: { displayName: 'Somchai P.', email: 'somchai@example.com' }, docType: 'National ID', submitted: '10 Jul 2026', retries: 0, status: 'pending' },
  { id: 2, user: { displayName: 'Ploy S.', email: 'ploy@example.com' }, docType: 'Passport', submitted: '12 Jul 2026', retries: 1, status: 'pending' },
  { id: 3, user: { displayName: 'Narin K.', email: 'narin@example.com' }, docType: 'Driver\'s licence', submitted: '14 Jul 2026', retries: 0, status: 'approved' },
  { id: 4, user: { displayName: 'Pim A.', email: 'pim@example.com' }, docType: 'National ID', submitted: '15 Jul 2026', retries: 2, status: 'rejected' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  let result = [...KYC_QUEUE]
  if (search) result = result.filter(k => k.user.displayName.toLowerCase().includes(search.toLowerCase()) || k.user.email.toLowerCase().includes(search.toLowerCase()))
  if (status) result = result.filter(k => k.status === status)
  return NextResponse.json({ data: result })
}
