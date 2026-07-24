import { NextRequest, NextResponse } from 'next/server'

export const AUDIT_LOG = [
  { id: 1, timestamp: '2026-07-18T10:23:00Z', actor: { email: 'admin@glowframe.com', role: 'super-admin' }, action: 'product.approve', entity: { type: 'product', id: '3' }, summary: "Approved listing 'Fujifilm X-T5'", delta: { before: { status: 'pending' }, after: { status: 'active' } } },
  { id: 2, timestamp: '2026-07-18T09:10:00Z', actor: { email: 'admin@glowframe.com', role: 'super-admin' }, action: 'user.suspend', entity: { type: 'user', id: '4' }, summary: "Suspended account 'Teerapat W.'", delta: { before: { status: 'active' }, after: { status: 'suspended' } } },
  { id: 3, timestamp: '2026-07-17T15:45:00Z', actor: { email: 'finance@glowframe.com', role: 'finance' }, action: 'payout.approve', entity: { type: 'payout', id: '4' }, summary: "Approved payout ฿3,240 to Somchai P.", delta: { before: { status: 'pending' }, after: { status: 'approved' } } },
  { id: 4, timestamp: '2026-07-17T11:30:00Z', actor: { email: 'admin@glowframe.com', role: 'super-admin' }, action: 'booking.cancel', entity: { type: 'booking', id: '4' }, summary: "Cancelled booking #456789-01", delta: { before: { status: 'active' }, after: { status: 'cancelled' } } },
  { id: 5, timestamp: '2026-07-16T08:00:00Z', actor: { email: 'admin@glowframe.com', role: 'super-admin' }, action: 'settings.update', entity: { type: 'settings', id: 'fees' }, summary: "Updated platform fee to 10%", delta: { before: { platformFee: 8 }, after: { platformFee: 10 } } },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const actor = searchParams.get('actor') ?? ''
  const action = searchParams.get('action') ?? ''
  let result = [...AUDIT_LOG]
  if (search) result = result.filter(e => e.actor.email.includes(search) || e.entity.id.includes(search))
  if (actor) result = result.filter(e => e.actor.email === actor)
  if (action) result = result.filter(e => e.action.startsWith(action.replace('.*', '')))
  return NextResponse.json({ data: result })
}
