import { NextRequest, NextResponse } from 'next/server'
import { FEATURE_FLAGS } from '../route'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const idx = FEATURE_FLAGS.findIndex(f => f.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (typeof body.enabled === 'boolean') FEATURE_FLAGS[idx].enabled = body.enabled
  else Object.assign(FEATURE_FLAGS[idx], body)
  FEATURE_FLAGS[idx].lastChanged = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return NextResponse.json({ data: FEATURE_FLAGS[idx] })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const idx = FEATURE_FLAGS.findIndex(f => f.id === Number(id))
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (FEATURE_FLAGS[idx].enabled) return NextResponse.json({ error: 'Cannot delete enabled flag' }, { status: 400 })
  FEATURE_FLAGS.splice(idx, 1)
  return NextResponse.json({ data: null })
}
