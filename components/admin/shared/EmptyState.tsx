'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  sub: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, heading, sub, action }: EmptyStateProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="[padding:60px_20px] text-center">
      <Icon size={48} className="text-gf-brown-300 [margin:0_auto_16px] block" />
      <p className="text-[16px] font-semibold text-gf-brown-900 [margin:0_0_8px]">{translateText(locale, heading)}</p>
      <p className="text-[13.5px] text-gf-muted max-w-[360px] [margin:0_auto]">{translateText(locale, sub)}</p>
      {action && <div className="[margin-top:20px]">{action}</div>}
    </div>
  );
}
