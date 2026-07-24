import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { bank, account, amount } = await req.json();

  if (!bank || !account || !amount) {
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
  }

  // TODO: check wallet balance via Prisma, deduct, create withdrawal record
  return NextResponse.json({
    data: { bank, account, amount, status: 'pending', createdAt: new Date().toISOString() },
    message: 'ส่งคำขอถอนเงินเรียบร้อยแล้ว',
  });
}
