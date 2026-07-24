import { NextRequest, NextResponse } from 'next/server';
import type { Product } from '@/types';

/* Mock data for prototype. Public listing only returns approved/active products. */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Fujifilm Instax Mini 12',
    desc: 'Instant camera with simple controls and soft color rendering.',
    price: 180,
    deposit: 500,
    color: '#F3C9D2',
    rating: 5,
    status: 'approved',
    unavailableDates: ['2026-07-25', '2026-07-26'],
  },
  {
    id: 2,
    name: 'Canon IXY 30S (Canon IXUS 300 HS)',
    desc: 'Compact digital camera with battery, charger, and card reader.',
    price: 250,
    deposit: 800,
    color: '#D9E7F2',
    rating: 5,
    status: 'approved',
    unavailableDates: ['2026-07-28'],
  },
  {
    id: 3,
    name: 'Canon IXUS 105 (IXY 200F)',
    desc: 'Compact digital camera awaiting admin review.',
    price: 250,
    deposit: 800,
    color: '#D7ECD9',
    rating: 5,
    status: 'pending',
    unavailableDates: [],
  },
];

export async function GET() {
  return NextResponse.json({
    data: MOCK_PRODUCTS.filter((p) => p.status === 'approved' || p.status === 'active'),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const newProduct: Product = {
    id: Date.now(),
    name: body.name ?? 'New Camera',
    desc: body.desc ?? '',
    price: Number(body.price) || 0,
    deposit: Number(body.deposit) || 0,
    color: body.color ?? '#F3C9D2',
    rating: 5,
    status: 'pending',
    unavailableDates: [],
  };
  MOCK_PRODUCTS.push(newProduct);
  return NextResponse.json({ data: newProduct }, { status: 201 });
}
