'use client';

import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

interface BreadcrumbProps {
  items: string[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const locale = useAppStore((s) => s.locale);

  return (
    <div className="inline-flex items-center gap-[8px] bg-gf-pink-300 text-gf-brown-900 [padding:11px_22px] rounded-full text-[14.5px] font-semibold [margin-bottom:24px]">
      {items.map((item, i) =>
        i < items.length - 1 ? (
          <span key={i} className="flex items-center gap-[8px]">
            <span className="opacity-[0.65] font-medium">{translateText(locale, item)}</span>
            <span className="opacity-[0.5] font-normal">›</span>
          </span>
        ) : (
          <span key={i}>{translateText(locale, item)}</span>
        )
      )}
    </div>
  );
}
