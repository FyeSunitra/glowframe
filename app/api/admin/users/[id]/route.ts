import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_USERS } from '../route'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const idx = ADMIN_USERS.findIndex(u => u.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.action === 'suspend') ADMIN_USERS[idx].status = 'suspended'
  else if (body.action === 'unsuspend') ADMIN_USERS[idx].status = 'active'

  return NextResponse.json({ data: ADMIN_USERS[idx] })
}
