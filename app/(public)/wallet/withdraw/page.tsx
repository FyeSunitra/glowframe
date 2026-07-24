'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { money } from '@/lib/utils';
import type { Wallet } from '@/types';

export default function WalletWithdrawPage() {
  const router = useRouter();
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: async () => (await axios.get('/api/wallet')).data.data,
  });

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['Wallet', 'ถอนเงิน']} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:16px]">ถอนเงิน</div>
        <div className="bg-gf-pink-100 rounded-[14px] [padding:14px] [margin-bottom:16px] text-[13px] text-gf-brown-700 [line-height:1.6]">
          Simulated prototype wallet: withdrawal requests do not connect to a bank or transfer real funds.
        </div>
        <div onClick={() => router.push('/wallet/bank')} className="flex justify-between items-center [padding:16px_4px] [border-bottom:1px_solid_var(--gf-line)] cursor-pointer">
          <div className="flex items-center gap-[14px]">
            <div className="w-[52px] h-[52px] rounded-[12px] bg-gf-pink-100 flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-gf-brown-700" />
            </div>
            <b>บัญชีธนาคาร</b>
          </div>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}
