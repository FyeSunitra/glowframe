import { NextResponse } from 'next/server';
import type { Wallet } from '@/types';

const MOCK_WALLET: Wallet = {
  balance: 0,
  history: [
    { id: 1, name: 'ชำระโดย K.VaVa',   date: '9 ก.ค. 2569', amt: 289, status: 'สำเร็จ' },
    { id: 2, name: 'ชำระโดย K.TeeTee', date: '9 ก.ค. 2569', amt: 199, status: 'สำเร็จ' },
    { id: 3, name: 'ชำระโดย K.Pippor', date: '9 ก.ค. 2569', amt: 200, status: 'สำเร็จ' },
  ],
};

export async function GET() {
  // TODO: prisma.wallet.findUnique({ where: { userId } })
  return NextResponse.json({ data: MOCK_WALLET });
}
