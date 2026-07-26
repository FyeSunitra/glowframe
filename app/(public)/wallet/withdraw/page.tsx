'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { money } from '@/lib/utils';
import type { Wallet } from '@/types';
import { getPageText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

export default function WalletWithdrawPage() {
  const router = useRouter();
  const t = getPageText(useAppStore((s) => s.locale), 'wallet');
  const { data: wallet } = useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: async () => (await axios.get('/api/wallet')).data.data,
  });

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.title, t.withdraw]} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:16px]">{t.withdraw}</div>
        <div onClick={() => router.push('/wallet/bank')} className="flex justify-between items-center [padding:16px_4px] [border-bottom:1px_solid_var(--gf-line)] cursor-pointer">
          <div className="flex items-center gap-[14px]">
            <div className="w-[52px] h-[52px] rounded-[12px] bg-gf-pink-100 flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-gf-brown-700" />
            </div>
            <b>{t.bankAccount}</b>
          </div>
          <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
}
