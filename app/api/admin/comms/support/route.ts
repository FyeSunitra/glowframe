import { NextRequest, NextResponse } from 'next/server'

export const TICKETS = [
  { id: 1, ticketId: '#1001', user: { displayName: 'Somchai P.' }, category: 'payment', subject: 'Payment was charged but booking not confirmed', priority: 'high', assignee: null, opened: '17 Jul 2026', lastReply: '18 Jul 2026', status: 'open' },
  { id: 2, ticketId: '#1002', user: { displayName: 'Ploy S.' }, category: 'booking', subject: 'Owner did not show up for pickup', priority: 'high', assignee: 'Admin', opened: '16 Jul 2026', lastReply: '17 Jul 2026', status: 'in-progress' },
  { id: 3, ticketId: '#1003', user: { displayName: 'Narin K.' }, category: 'account', subject: 'Cannot verify phone number', priority: 'medium', assignee: null, opened: '15 Jul 2026', lastReply: '15 Jul 2026', status: 'open' },
  { id: 4, ticketId: '#1004', user: { displayName: 'Pim A.' }, category: 'listing', subject: 'My listing was rejected without reason', priority: 'low', assignee: 'Admin', opened: '10 Jul 2026', lastReply: '12 Jul 2026', status: 'resolved' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const priority = searchParams.get('priority') ?? ''
  const tab = searchParams.get('tab') ?? 'open'
  let result = [...TICKETS]
  if (tab !== 'all') result = result.filter(t => t.status === tab)
  if (search) result = result.filter(t => t.ticketId.includes(search) || t.subject.toLowerCase().includes(search.toLowerCase()))
  if (category) result = result.filter(t => t.category === category)
  if (priority) result = result.filter(t => t.priority === priority)
  return NextResponse.json({ data: result })
}
