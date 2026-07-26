import { NextResponse } from 'next/server';
import type { Wallet } from '@/types';

const MOCK_WALLET: Wallet = {
  balance: 0,
  history: [
    { id: 1, name: 'K.VaVa',   kind: 'payment', date: '2026-07-09', amt: 289, status: 'completed' },
    { id: 2, name: 'K.TeeTee', kind: 'payment', date: '2026-07-09', amt: 199, status: 'completed' },
    { id: 3, name: 'K.Pippor', kind: 'payment', date: '2026-07-09', amt: 200, status: 'completed' },
  ],
};

export async function GET() {
  // TODO: prisma.wallet.findUnique({ where: { userId } })
  return NextResponse.json({ data: MOCK_WALLET });
}
