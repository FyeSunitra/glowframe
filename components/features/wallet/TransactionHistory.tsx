'use client';

import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPageText, translateStatus } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';
import type { WalletTransaction } from '@/types';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  items: WalletTransaction[];
  showChevron?: boolean;
}

export function TransactionHistory({ items, showChevron = false }: TransactionHistoryProps) {
  const router = useRouter();
  const locale = useAppStore((s) => s.locale);
  const t = getPageText(locale, 'wallet');

  return (
    <div>
      {items.map((h) => (
        <div
          key={h.id}
          onClick={showChevron ? () => router.push('/wallet/income') : undefined}
          className={cn(
            'flex items-center justify-between border-b border-gf-line px-1 py-3.5',
            showChevron ? 'cursor-pointer' : 'cursor-default',
          )}
        >
          <div className="flex items-center gap-[12px]">
            <div className="w-[38px] h-[38px] rounded-full bg-[#DFF2E0] flex items-center justify-center text-gf-green shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="font-semibold text-[14px]">
                {h.kind === 'payment' ? `${t.paymentFrom} ${h.name}` : h.name}
              </div>
              <div className="text-[12px] text-gf-muted">
                {formatTransactionDate(h.date, locale)} · {translateStatus(locale, h.status)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-[6px]">
            <span className="font-bold text-gf-green">+ ฿{h.amt}</span>
            {showChevron && <ChevronRight size={12} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTransactionDate(value: string, locale: 'th' | 'en') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}
