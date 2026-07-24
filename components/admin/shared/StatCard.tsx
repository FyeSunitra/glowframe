'use client';

import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from './StatusBadge';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ icon: Icon, label, value, trend, trendUp }: StatCardProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow-sm)] [padding:24px]">
      <div className="w-[38px] h-[38px] rounded-full bg-gf-pink-100 text-gf-brown-700 flex items-center justify-center">
        <Icon size={18} />
      </div>
      <p className="text-[13px] text-gf-muted [margin-top:12px] [margin:12px_0_0]">{translateText(locale, label)}</p>
      {value === '' ? (
        <Skeleton className="h-7 w-24 mt-2" />
      ) : (
        <p className="text-[28px] font-bold text-gf-brown-900 font-[var(--font-poppins)] [margin:4px_0_0]">{value}</p>
      )}
      {trend && (
        <div className="text-[11px] [margin-top:6px]">
          <StatusBadge status={trendUp ? 'active' : 'rejected'} />
          <span className="[margin-left:6px] text-[11px] text-gf-muted">{trend}</span>
        </div>
      )}
    </div>
  );
}
