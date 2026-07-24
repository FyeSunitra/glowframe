import { NextRequest, NextResponse } from 'next/server'

export const PROMOS = [
  { id: 1, code: 'WELCOME10', type: 'percentage', value: 10, minBookingValue: null, used: 42, limit: 200, expires: '31 Dec 2026', status: 'active' },
  { id: 2, code: 'SUMMER500', type: 'flat', value: 500, minBookingValue: 2000, used: 18, limit: 100, expires: '31 Aug 2026', status: 'active' },
  { id: 3, code: 'FIRSTBOOK', type: 'percentage', value: 15, minBookingValue: null, used: 67, limit: null, expires: null, status: 'active' },
  { id: 4, code: 'EXPIRED20', type: 'percentage', value: 20, minBookingValue: null, used: 100, limit: 100, expires: '1 Jun 2026', status: 'expired' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const type = searchParams.get('type') ?? ''
  let result = [...PROMOS]
  if (search) result = result.filter(p => p.code.toLowerCase().includes(search.toLowerCase()))
  if (status) result = result.filter(p => p.status === status)
  if (type) result = result.filter(p => p.type === type)
  return NextResponse.json({ data: result })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const newPromo = { id: Date.now(), used: 0, status: 'active', ...body }
  PROMOS.push(newPromo)
  return NextResponse.json({ data: newPromo }, { status: 201 })
}
