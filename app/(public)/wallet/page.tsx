'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { WalletHero } from '@/components/features/wallet/WalletHero';
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory';
import type { Wallet } from '@/types';
import { getPageText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

async function fetchWallet(): Promise<Wallet> {
  const { data } = await axios.get('/api/wallet');
  return data.data;
}

export default function WalletPage() {
  const t = getPageText(useAppStore((s) => s.locale), 'wallet');
  const { data: wallet } = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.title]} />
      <WalletHero balance={wallet?.balance ?? 0} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px] [margin-top:20px]">
        <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:16px]">{t.recentTransactions}</div>
        <TransactionHistory items={wallet?.history.slice(0, 3) ?? []} />
      </div>
    </div>
  );
}
