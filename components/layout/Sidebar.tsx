'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Info, Images } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getMenuText } from '@/lib/menuI18n';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/about',       labelKey: 'about',     icon: Info },
  { href: '/for-rent',    labelKey: 'forRent',   icon: Camera },
  { href: '/photobooth',  labelKey: 'photobooth', icon: Images },
];

/** Which sidebar key is "active" for nested routes */
function activeKey(pathname: string): string {
  if (pathname.startsWith('/about'))        return '/about';
  if (pathname.startsWith('/for-rent') || pathname.startsWith('/transaction') || pathname.startsWith('/booking-confirmed'))
    return '/for-rent';
  if (pathname.startsWith('/photobooth'))     return '/photobooth';
  return '/for-rent';
}

export function Sidebar() {
  const pathname = usePathname();
  const t = getMenuText(useAppStore((s) => s.locale));
  const active = activeKey(pathname);

  return (
    <nav className="flex w-[250px] shrink-0 flex-col gap-1.5 px-[18px] py-[26px] max-[900px]:w-full max-[900px]:flex-row max-[900px]:overflow-x-auto max-[900px]:overflow-y-visible max-[900px]:border-b max-[900px]:border-gf-line max-[900px]:px-3.5 max-[900px]:py-3 [&_a]:max-[900px]:whitespace-nowrap [&_button]:max-[900px]:whitespace-nowrap">
      {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
        const isActive = active === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-[13px] rounded-[16px] px-4 py-[13px] text-[15px] no-underline transition-colors',
              isActive
                ? 'bg-gf-brown-300 font-semibold text-gf-brown-900'
                : 'bg-transparent font-medium text-gf-brown-700',
            )}
          >
            <Icon size={20} className="shrink-0" />
            <span>{t[labelKey]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
