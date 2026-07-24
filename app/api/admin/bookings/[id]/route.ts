import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_BOOKINGS } from '../route'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const idx = ADMIN_BOOKINGS.findIndex(b => b.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.action === 'cancel') ADMIN_BOOKINGS[idx].status = 'cancelled'
  else if (body.status) ADMIN_BOOKINGS[idx].status = body.status

  return NextResponse.json({ data: ADMIN_BOOKINGS[idx] })
}
