import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_PRODUCTS = [
  { id: 1, name: 'Canon EOS R5', desc: 'Full-frame mirrorless, 45MP', price: 900, deposit: 5000, color: '#F3C9D2', rating: 5, bookingCount: 18, status: 'active', createdAt: '2026-03-10', owner: { id: 1, displayName: 'Somchai P.', email: 'somchai@example.com' } },
  { id: 2, name: 'Sony A7 IV', desc: 'Full-frame, 33MP, 4K60', price: 800, deposit: 4500, color: '#D9E7F2', rating: 4, bookingCount: 12, status: 'active', createdAt: '2026-04-02', owner: { id: 2, displayName: 'Narin K.', email: 'narin@example.com' } },
  { id: 3, name: 'Fujifilm X-T5', desc: '40MP APS-C, film simulations', price: 650, deposit: 3500, color: '#D7ECD9', rating: 5, bookingCount: 9, status: 'pending', createdAt: '2026-05-14', owner: { id: 3, displayName: 'Ploy S.', email: 'ploy@example.com' } },
  { id: 4, name: 'Nikon Z6 III', desc: 'Full-frame hybrid, 6K video', price: 950, deposit: 5500, color: '#F7E3B7', rating: 4, bookingCount: 7, status: 'active', createdAt: '2026-05-20', owner: { id: 4, displayName: 'Teerapat W.', email: 'teerapat@example.com' } },
  { id: 5, name: 'OM System OM-1', desc: 'MFT, weather-sealed, 20fps', price: 700, deposit: 4000, color: '#F3C9D2', rating: 4, bookingCount: 5, status: 'rejected', createdAt: '2026-06-01', owner: { id: 5, displayName: 'Pim A.', email: 'pim@example.com' } },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const price = searchParams.get('price') ?? ''

  let result = [...ADMIN_PRODUCTS]
  if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.owner.displayName.toLowerCase().includes(search.toLowerCase()))
  if (status) result = result.filter(p => p.status === status)
  if (price === 'under500') result = result.filter(p => p.price < 500)
  if (price === '500-1500') result = result.filter(p => p.price >= 500 && p.price <= 1500)
  if (price === 'above1500') result = result.filter(p => p.price > 1500)

  return NextResponse.json({ data: result })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const newProduct = { id: Date.now(), bookingCount: 0, status: 'pending', createdAt: new Date().toISOString().slice(0, 10), rating: 5, color: '#F3C9D2', owner: { id: 0, displayName: 'Admin', email: 'admin@glowframe.com' }, ...body }
  ADMIN_PRODUCTS.push(newProduct)
  return NextResponse.json({ data: newProduct }, { status: 201 })
}
