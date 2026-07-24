import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_BOOKINGS = [
  { id: 1, bookingNo: '123456-78', camera: { name: 'Canon EOS R5', color: '#F3C9D2' }, renter: { displayName: 'Somchai P.', email: 'somchai@example.com' }, owner: { displayName: 'Narin K.', email: 'narin@example.com' }, days: 5, delivery: 'grab', rentalFee: 4500, deliveryFee: 200, discount: 0, total: 4700, startDate: '12 Jul 2026', endDate: '17 Jul 2026', paymentMethod: 'qr', status: 'active', createdAt: '10 Jul 2026' },
  { id: 2, bookingNo: '234567-89', camera: { name: 'Sony A7 IV', color: '#D9E7F2' }, renter: { displayName: 'Ploy S.', email: 'ploy@example.com' }, owner: { displayName: 'Teerapat W.', email: 'teerapat@example.com' }, days: 3, delivery: 'pickup', rentalFee: 2400, deliveryFee: 0, discount: 0, total: 2400, startDate: '10 Jul 2026', endDate: '12 Jul 2026', paymentMethod: 'card', status: 'pending', createdAt: '9 Jul 2026' },
  { id: 3, bookingNo: '345678-90', camera: { name: 'Fujifilm X-T5', color: '#D7ECD9' }, renter: { displayName: 'Pim A.', email: 'pim@example.com' }, owner: { displayName: 'Somchai P.', email: 'somchai@example.com' }, days: 2, delivery: 'post', rentalFee: 1300, deliveryFee: 150, discount: 100, total: 1350, startDate: '8 Jul 2026', endDate: '9 Jul 2026', paymentMethod: 'qr', status: 'active', createdAt: '7 Jul 2026' },
  { id: 4, bookingNo: '456789-01', camera: { name: 'Nikon Z6 III', color: '#F7E3B7' }, renter: { displayName: 'Teerapat W.', email: 'teerapat@example.com' }, owner: { displayName: 'Ploy S.', email: 'ploy@example.com' }, days: 3, delivery: 'grab', rentalFee: 2850, deliveryFee: 200, discount: 0, total: 3050, startDate: '5 Jul 2026', endDate: '7 Jul 2026', paymentMethod: 'qr', status: 'cancelled', createdAt: '3 Jul 2026' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const delivery = searchParams.get('delivery') ?? ''

  let result = [...ADMIN_BOOKINGS]
  if (search) result = result.filter(b => b.bookingNo.includes(search) || b.renter.displayName.toLowerCase().includes(search.toLowerCase()))
  if (status) result = result.filter(b => b.status === status)
  if (delivery) result = result.filter(b => b.delivery === delivery)

  return NextResponse.json({ data: result })
}
