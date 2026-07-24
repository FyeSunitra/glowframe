import { NextResponse } from 'next/server'

const STATS = {
  users: 1240,
  listings: 89,
  bookings: 34,
  revenue: 125000,
}

const RECENT_BOOKINGS = [
  { id: 1, bookingNo: '123456-78', camera: 'Canon EOS R5', renter: 'Somchai P.', rentalDate: '12–17 Jul 2026', total: 4500, status: 'active' },
  { id: 2, bookingNo: '234567-89', camera: 'Sony A7 IV', renter: 'Narin K.', rentalDate: '10–12 Jul 2026', total: 2600, status: 'pending' },
  { id: 3, bookingNo: '345678-90', camera: 'Fujifilm X-T5', renter: 'Ploy S.', rentalDate: '8–9 Jul 2026', total: 1800, status: 'active' },
  { id: 4, bookingNo: '456789-01', camera: 'Nikon Z6 III', renter: 'Teerapat W.', rentalDate: '5–7 Jul 2026', total: 3200, status: 'cancelled' },
  { id: 5, bookingNo: '567890-12', camera: 'OM System OM-1', renter: 'Pim A.', rentalDate: '1–3 Jul 2026', total: 2100, status: 'active' },
]

const RECENT_TRANSACTIONS = [
  { id: 1, name: 'Booking #123456-78', date: '12 Jul 2026', amt: 4500, status: 'paid' },
  { id: 2, name: 'Booking #234567-89', date: '10 Jul 2026', amt: 2600, status: 'pending' },
  { id: 3, name: 'Booking #345678-90', date: '8 Jul 2026', amt: 1800, status: 'paid' },
  { id: 4, name: 'Booking #456789-01', date: '5 Jul 2026', amt: 3200, status: 'refunded' },
  { id: 5, name: 'Booking #567890-12', date: '1 Jul 2026', amt: 2100, status: 'paid' },
]

export async function GET() {
  return NextResponse.json({
    data: { stats: STATS, recentBookings: RECENT_BOOKINGS, recentTransactions: RECENT_TRANSACTIONS },
  })
}
