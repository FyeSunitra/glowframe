'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getMenuText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/account/profile', labelKey: 'profile' },
  { href: '/account/address', labelKey: 'address' },
  { href: '/account/security', labelKey: 'security' },
  { href: '/account/verify', labelKey: 'verify' },
];

export function AccountTabs({ active }: { active: string }) {
  const pathname = usePathname();
  const t = getMenuText(useAppStore((s) => s.locale));

  return (
    <div className="flex gap-[10px] [margin-bottom:20px] flex-wrap">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href) || active === tab.labelKey;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-full border-b-2 px-[18px] py-[9px] text-sm no-underline',
              isActive
                ? 'border-gf-brown-800 font-bold text-gf-brown-900'
                : 'border-transparent font-medium text-gf-muted',
            )}
          >
            {t[tab.labelKey]}
          </Link>
        );
      })}
    </div>
  );
}
