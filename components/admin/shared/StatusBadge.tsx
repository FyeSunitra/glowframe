'use client';

import { translateStatus } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const locale = useAppStore((state) => state.locale);
  const s = status.toLowerCase();

  let toneClass: string;

  if (['active', 'paid', 'approved', 'verified'].includes(s)) {
    toneClass = 'bg-[#DFF2E0] text-gf-green';
  } else if (s === 'pending' || s === 'pending_review' || s === 'payment_review') {
    toneClass = 'bg-[#FEF3CD] text-gf-yellow';
  } else if (['rejected', 'cancelled', 'suspended', 'failed'].includes(s)) {
    toneClass = 'bg-[#FAE0DA] text-gf-red';
  } else {
    toneClass = 'bg-gf-pink-100 text-gf-brown-700';
  }

  return (
    <span className={cn('inline-block rounded-full px-2.5 py-[3px] text-xs font-semibold', toneClass)}>
      {translateStatus(locale, status)}
    </span>
  );
}
