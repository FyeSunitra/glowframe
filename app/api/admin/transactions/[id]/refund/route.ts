import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_TRANSACTIONS } from '../../route'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = ADMIN_TRANSACTIONS.findIndex(t => t.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (ADMIN_TRANSACTIONS[idx].status !== 'paid') return NextResponse.json({ error: 'Cannot refund' }, { status: 400 })

  ADMIN_TRANSACTIONS[idx].status = 'refunded'
  return NextResponse.json({ data: ADMIN_TRANSACTIONS[idx] })
}
