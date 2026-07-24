import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_USERS = [
  { id: 1, displayName: 'Somchai P.', fullName: 'Somchai Phromma', email: 'somchai@example.com', phone: '081-234-5678', phoneVerified: true, emailVerified: true, idVerified: true, listings: 3, bookings: 12, joinedAt: '15 Jan 2026', status: 'active' },
  { id: 2, displayName: 'Narin K.', fullName: 'Narin Kongkaw', email: 'narin@example.com', phone: '082-345-6789', phoneVerified: true, emailVerified: true, idVerified: false, listings: 1, bookings: 8, joinedAt: '20 Feb 2026', status: 'active' },
  { id: 3, displayName: 'Ploy S.', fullName: 'Ploy Srirat', email: 'ploy@example.com', phone: '083-456-7890', phoneVerified: true, emailVerified: false, idVerified: false, listings: 2, bookings: 5, joinedAt: '5 Mar 2026', status: 'active' },
  { id: 4, displayName: 'Teerapat W.', fullName: 'Teerapat Wongkam', email: 'teerapat@example.com', phone: '084-567-8901', phoneVerified: false, emailVerified: true, idVerified: false, listings: 0, bookings: 3, joinedAt: '10 Apr 2026', status: 'suspended' },
  { id: 5, displayName: 'Pim A.', fullName: 'Pim Ariyarat', email: 'pim@example.com', phone: '085-678-9012', phoneVerified: true, emailVerified: true, idVerified: true, listings: 1, bookings: 7, joinedAt: '22 Apr 2026', status: 'active' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const verification = searchParams.get('verification') ?? ''

  let result = [...ADMIN_USERS]
  if (search) result = result.filter(u => u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  if (status) result = result.filter(u => u.status === status)
  if (verification === 'verified') result = result.filter(u => u.phoneVerified && u.emailVerified && u.idVerified)
  if (verification === 'unverified') result = result.filter(u => !(u.phoneVerified && u.emailVerified && u.idVerified))

  return NextResponse.json({ data: result })
}
