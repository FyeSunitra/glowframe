import { NextRequest, NextResponse } from 'next/server'

export const FEATURE_FLAGS = [
  { id: 1, key: 'id_verification_required', description: 'Require KYC before listing or renting', target: 'all', enabled: false, lastChanged: '1 Jul 2026', lastChangedBy: 'admin@glowframe.com' },
  { id: 2, key: 'qr_payment_enabled', description: 'Show Thai QR payment option', target: 'all', enabled: true, lastChanged: '1 Jun 2026', lastChangedBy: 'admin@glowframe.com' },
  { id: 3, key: 'card_payment_enabled', description: 'Show VISA/Mastercard payment option', target: 'all', enabled: true, lastChanged: '1 Jun 2026', lastChangedBy: 'admin@glowframe.com' },
  { id: 4, key: 'grab_delivery_enabled', description: 'Show Grab/แมส delivery option', target: 'all', enabled: true, lastChanged: '1 Jun 2026', lastChangedBy: 'admin@glowframe.com' },
  { id: 5, key: 'post_delivery_enabled', description: 'Show postal delivery option', target: 'all', enabled: true, lastChanged: '1 Jun 2026', lastChangedBy: 'admin@glowframe.com' },
  { id: 6, key: 'promo_codes_enabled', description: 'Allow promo code entry at checkout', target: 'all', enabled: false, lastChanged: '15 Jun 2026', lastChangedBy: 'admin@glowframe.com' },
  { id: 7, key: 'new_user_onboarding', description: 'Show onboarding flow to new signups', target: 'all', enabled: false, lastChanged: '10 Jul 2026', lastChangedBy: 'admin@glowframe.com' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const target = searchParams.get('target') ?? ''
  let result = [...FEATURE_FLAGS]
  if (search) result = result.filter(f => f.key.includes(search) || f.description.toLowerCase().includes(search.toLowerCase()))
  if (status === 'enabled') result = result.filter(f => f.enabled)
  if (status === 'disabled') result = result.filter(f => !f.enabled)
  if (target && target !== 'all') result = result.filter(f => f.target === target)
  return NextResponse.json({ data: result })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const newFlag = { id: Date.now(), enabled: false, lastChanged: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), lastChangedBy: 'admin@glowframe.com', ...body }
  FEATURE_FLAGS.push(newFlag)
  return NextResponse.json({ data: newFlag }, { status: 201 })
}
