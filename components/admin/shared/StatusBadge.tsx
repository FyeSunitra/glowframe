'use client';

import { translateStatus } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const locale = useAppStore((state) => state.locale);
  const s = status
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();

  let toneClass: string;

  if ([
    'active',
    'paid',
    'approved',
    'verified',
    'payment_approved',
    'completed',
    'ready_for_pickup',
  ].includes(s)) {
    toneClass = 'bg-[#DFF2E0] text-gf-green';
  } else if (
    s === 'pending' ||
    s === 'pending_review' ||
    s === 'payment_review' ||
    s === 'pending_payment' ||
    s === 'pending_payment_review' ||
    s === 'preparing' ||
    s === 'return_pending'
  ) {
    toneClass = 'bg-[#FEF3CD] text-gf-yellow';
  } else if ([
    'rejected',
    'cancelled',
    'suspended',
    'failed',
    'payment_rejected',
    'expired',
    'delivery_issue',
    'disputed',
  ].includes(s)) {
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
