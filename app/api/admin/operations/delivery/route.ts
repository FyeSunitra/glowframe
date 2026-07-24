import { NextRequest, NextResponse } from 'next/server'

export const DELIVERIES = [
  { id: 1, bookingNo: '123456-78', camera: 'Canon EOS R5', direction: 'outbound', carrier: 'Grab', trackingNo: 'GRB-20260712-001', renterAddress: '123/4 Sukhumvit Rd, Bangkok 10110', expected: '12 Jul 2026', lastEvent: 'Picked up by driver', status: 'delivered' },
  { id: 2, bookingNo: '234567-89', camera: 'Sony A7 IV', direction: 'outbound', carrier: 'Thailand Post', trackingNo: 'TH-EX-987654321', renterAddress: '56 Nimman Rd, Chiang Mai 50200', expected: '10 Jul 2026', lastEvent: 'In transit - Bangkok sorting', status: 'in-transit' },
  { id: 3, bookingNo: '123456-78', camera: 'Canon EOS R5', direction: 'return', carrier: 'Grab', trackingNo: 'GRB-20260717-002', renterAddress: '123/4 Sukhumvit Rd, Bangkok 10110', expected: '17 Jul 2026', lastEvent: 'Waiting for pickup', status: 'pending' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const carrier = searchParams.get('carrier') ?? ''
  const direction = searchParams.get('direction') ?? ''
  const tab = searchParams.get('tab') ?? 'active'
  let result = [...DELIVERIES]
  if (tab === 'active') result = result.filter(d => ['pending', 'in-transit'].includes(d.status))
  else if (tab === 'delivered') result = result.filter(d => d.status === 'delivered')
  else if (tab === 'issues') result = result.filter(d => d.status === 'failed')
  if (search) result = result.filter(d => d.bookingNo.includes(search) || d.trackingNo.includes(search))
  if (carrier) result = result.filter(d => d.carrier.toLowerCase() === carrier.toLowerCase())
  if (direction) result = result.filter(d => d.direction === direction)
  return NextResponse.json({ data: result })
}
