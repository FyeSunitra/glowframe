'use client';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { money } from '@/lib/utils';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

interface WalletHeroProps {
  balance: number;
  onWithdraw?: () => void;
}

export function WalletHero({ balance, onWithdraw }: WalletHeroProps) {
  const router = useRouter();
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="bg-gf-brown-800 text-gf-pink-100 rounded-[22px] [padding:30px] relative overflow-hidden">
      <div className="flex gap-[22px] text-[14px] text-gf-pink-300 [margin-bottom:6px]">
        <span className="text-white font-bold [border-bottom:2px_solid_var(--gf-pink-500)] [padding-bottom:4px]">{translateText(locale, 'Total balance')}</span>
        <span
          onClick={() => router.push('/wallet/income')}
          className="cursor-pointer flex items-center gap-[4px]"
        >
          {translateText(locale, 'Transactions')} <ChevronRight size={12} />
        </span>
      </div>

      <div className="text-[42px] font-bold [margin:14px_0_4px] font-[var(--font-poppins)]">
        ฿ {money(balance)}
      </div>

      <button
        onClick={onWithdraw ?? (() => router.push('/wallet/withdraw'))}
        className="[margin-top:10px] inline-flex items-center gap-[8px] border-0 rounded-full [padding:9px_16px] font-semibold text-[13px] bg-gf-pink-500 text-gf-brown-900 cursor-pointer"
      >
        {translateText(locale, 'Withdraw')}
      </button>

      <div
        onClick={() => router.push('/wallet/income')}
        className="flex justify-between items-center bg-[rgba(255,255,255,.08)] rounded-[14px] [padding:14px_16px] [margin-top:18px] text-[14px] cursor-pointer"
      >
        <span>{translateText(locale, 'My income')}</span>
        <ChevronRight size={16} />
      </div>
    </div>
  );
}
