import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_TRANSACTIONS } from '../route'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const idx = ADMIN_TRANSACTIONS.findIndex(t => t.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.action === 'approve_payment') {
    ADMIN_TRANSACTIONS[idx].status = 'paid'
    return NextResponse.json({ data: ADMIN_TRANSACTIONS[idx], message: 'Payment evidence approved' })
  }

  if (body.action === 'reject_payment') {
    ADMIN_TRANSACTIONS[idx].status = 'failed'
    return NextResponse.json({ data: ADMIN_TRANSACTIONS[idx], message: 'Payment evidence rejected' })
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
}
