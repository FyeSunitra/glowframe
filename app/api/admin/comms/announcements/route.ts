import { NextRequest, NextResponse } from 'next/server'

export const ANNOUNCEMENTS = [
  { id: 1, title: 'Platform fee update', segment: 'all', sendTime: '18 Jul 2026 09:00', recipients: 1240, readRate: 62, status: 'sent' },
  { id: 2, title: 'New rental protection policy', segment: 'owners', sendTime: '20 Jul 2026 10:00', recipients: 0, readRate: 0, status: 'scheduled' },
  { id: 3, title: 'Summer discount available', segment: 'renters', sendTime: null, recipients: 0, readRate: 0, status: 'draft' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') ?? 'all'
  let result = [...ANNOUNCEMENTS]
  if (tab !== 'all') result = result.filter(a => a.status === tab)
  return NextResponse.json({ data: result })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const newAnn = { id: Date.now(), recipients: 0, readRate: 0, status: 'draft', ...body }
  ANNOUNCEMENTS.push(newAnn)
  return NextResponse.json({ data: newAnn }, { status: 201 })
}
