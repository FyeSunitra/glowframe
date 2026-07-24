import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_PRODUCTS } from '../route'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const idx = ADMIN_PRODUCTS.findIndex(p => p.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.action === 'approve') ADMIN_PRODUCTS[idx].status = 'active'
  else if (body.action === 'reject') ADMIN_PRODUCTS[idx].status = 'rejected'
  else if (body.action === 'archive') ADMIN_PRODUCTS[idx].status = 'archived'
  else Object.assign(ADMIN_PRODUCTS[idx], body)

  return NextResponse.json({ data: ADMIN_PRODUCTS[idx] })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = ADMIN_PRODUCTS.findIndex(p => p.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  ADMIN_PRODUCTS.splice(idx, 1)
  return NextResponse.json({ data: null })
}
