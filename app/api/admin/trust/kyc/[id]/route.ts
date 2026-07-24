import { NextRequest, NextResponse } from 'next/server'
import { KYC_QUEUE } from '../route'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const idx = KYC_QUEUE.findIndex(k => k.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (body.action === 'approve') KYC_QUEUE[idx].status = 'approved'
  else if (body.action === 'reject') KYC_QUEUE[idx].status = 'rejected'
  return NextResponse.json({ data: KYC_QUEUE[idx] })
}
