'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory';
import type { Wallet } from '@/types';
import { getPageText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

export default function WalletIncomePage() {
  const t = getPageText(useAppStore((s) => s.locale), 'wallet');
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: async () => (await axios.get('/api/wallet')).data.data,
  });

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.title, t.myIncome]} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="flex justify-between items-center [margin-bottom:18px]">
          <div className="text-[19px] font-bold text-gf-brown-900">{t.history}</div>
          <div className="flex gap-[10px]">
            {[`${t.incoming} ▾`, `${t.all} ▾`].map((label) => (
              <span key={label} className="bg-gf-pink-100 text-gf-brown-800 rounded-full [padding:8px_16px] text-[13px] font-semibold inline-flex items-center gap-[6px]">{label}</span>
            ))}
          </div>
        </div>
        <TransactionHistory items={wallet?.history ?? []} showChevron />
      </div>
    </div>
  );
}
