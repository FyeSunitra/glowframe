import { NextRequest, NextResponse } from 'next/server';

/* In-memory store — replace with Prisma */
const ADDRESSES: { id: number; label: string; detail: string }[] = [];

export async function GET() {
  return NextResponse.json({ data: ADDRESSES });
}

export async function POST(req: NextRequest) {
  const { label, detail } = await req.json();
  const addr = { id: Date.now(), label: label ?? 'ที่อยู่', detail: detail ?? '' };
  ADDRESSES.push(addr);
  // TODO: prisma.address.create({ data: { userId, label, detail } })
  return NextResponse.json({ data: addr }, { status: 201 });
}
