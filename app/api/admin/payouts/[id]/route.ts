import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_PAYOUTS_PENDING, ADMIN_PAYOUTS_HISTORY } from '../route'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const idx = ADMIN_PAYOUTS_PENDING.findIndex(p => p.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const payout = ADMIN_PAYOUTS_PENDING.splice(idx, 1)[0]
  payout.status = body.action === 'approve' ? 'approved' : 'rejected'
  ADMIN_PAYOUTS_HISTORY.unshift(payout)

  return NextResponse.json({ data: payout })
}
