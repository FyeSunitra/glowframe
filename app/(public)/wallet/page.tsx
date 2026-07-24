'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { WalletHero } from '@/components/features/wallet/WalletHero';
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory';
import type { Wallet } from '@/types';

async function fetchWallet(): Promise<Wallet> {
  const { data } = await axios.get('/api/wallet');
  return data.data;
}

export default function WalletPage() {
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['Wallet']} />
      <WalletHero balance={wallet?.balance ?? 0} />
      <div className="bg-gf-pink-100 rounded-[14px] [padding:14px] [margin-top:16px] text-[13px] text-gf-brown-700 [line-height:1.6]">
        Simulated prototype wallet: balances, income, withdrawals, and deposit refunds are demo status records only. No real banking or escrow movement happens here.
      </div>
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px] [margin-top:20px]">
        <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:16px]">ธุรกรรมล่าสุด</div>
        <TransactionHistory items={wallet?.history.slice(0, 3) ?? []} />
      </div>
    </div>
  );
}
