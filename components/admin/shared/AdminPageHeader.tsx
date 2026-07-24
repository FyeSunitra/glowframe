'use client';

import { Breadcrumb } from '@/components/common/Breadcrumb';
import type { ReactNode } from 'react';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

interface AdminPageHeaderProps {
  breadcrumb: string[];
  title: string;
  action?: ReactNode;
}

export function AdminPageHeader({ breadcrumb, title, action }: AdminPageHeaderProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="[margin-bottom:26px]">
      <Breadcrumb items={breadcrumb.map((item) => translateText(locale, item))} />
      <div className="flex items-center justify-between [margin-top:4px]">
        <h1 className="text-[22px] font-bold font-[var(--font-poppins)] text-gf-brown-900 [margin:0]">{translateText(locale, title)}</h1>
        {action}
      </div>
    </div>
  );
}
