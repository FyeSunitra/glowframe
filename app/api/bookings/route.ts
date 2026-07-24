import { NextRequest, NextResponse } from 'next/server';

/* ── Mock booking store (in-memory; replace with Prisma) ─────── */
const MOCK_BOOKINGS: Record<string, unknown>[] = [];

export async function GET() {
  return NextResponse.json({ data: MOCK_BOOKINGS });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: validate & persist — prisma.booking.create({ data: body })
  const booking = {
    id: Date.now(),
    bookingNo: `${Math.floor(100000 + Math.random() * 899999)}-${Math.floor(10 + Math.random() * 89)}`,
    status: 'pending_payment_review',
    createdAt: new Date().toISOString(),
    ...body,
  };
  MOCK_BOOKINGS.push(booking);
  return NextResponse.json({ data: booking }, { status: 201 });
}
