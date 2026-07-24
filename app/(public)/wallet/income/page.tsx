'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory';
import type { Wallet } from '@/types';

export default function WalletIncomePage() {
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: async () => (await axios.get('/api/wallet')).data.data,
  });

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['Wallet', 'รายรับของฉัน']} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="bg-gf-pink-100 rounded-[14px] [padding:14px] [margin-bottom:18px] text-[13px] text-gf-brown-700 [line-height:1.6]">
          Simulated prototype wallet: this income history is mock data for review only.
        </div>
        <div className="flex justify-between items-center [margin-bottom:18px]">
          <div className="text-[19px] font-bold text-gf-brown-900">ประวัติการทำรายการ</div>
          <div className="flex gap-[10px]">
            {['เงินเข้า ▾', 'ทั้งหมด ▾'].map((label) => (
              <span key={label} className="bg-gf-pink-100 text-gf-brown-800 rounded-full [padding:8px_16px] text-[13px] font-semibold inline-flex items-center gap-[6px]">{label}</span>
            ))}
          </div>
        </div>
        <TransactionHistory items={wallet?.history ?? []} showChevron />
      </div>
    </div>
  );
}
