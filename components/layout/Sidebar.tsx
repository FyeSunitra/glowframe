'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Camera, User, Wallet, Info, LogOut,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useRouter } from 'next/navigation';
import { getMenuText } from '@/lib/menuI18n';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/about',       labelKey: 'about',     icon: Info },
  { href: '/home',        labelKey: 'home',      icon: Home },
  { href: '/for-rent',    labelKey: 'forRent',   icon: Camera },
  { href: '/account/profile', labelKey: 'myAccount', icon: User },
  { href: '/wallet',      labelKey: 'wallet',    icon: Wallet },
];

/** Which sidebar key is "active" for nested routes */
function activeKey(pathname: string): string {
  if (pathname.startsWith('/about'))        return '/about';
  if (pathname.startsWith('/for-rent') || pathname.startsWith('/transaction') || pathname.startsWith('/booking-confirmed'))
    return '/for-rent';
  if (pathname.startsWith('/list-camera'))  return '/home';
  if (pathname.startsWith('/home'))         return '/home';
  if (pathname.startsWith('/account'))      return '/account/profile';
  if (pathname.startsWith('/wallet'))       return '/wallet';
  return '/home';
}

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAppStore((s) => s.logout);
  const t = getMenuText(useAppStore((s) => s.locale));
  const router = useRouter();
  const active = activeKey(pathname);

  function handleLogout() {
    logout();
    router.push('/login');
  }

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

      <div className="h-[1px] bg-gf-line [margin:10px_6px]" />

      <button
        onClick={handleLogout}
        className="flex items-center gap-[13px] [padding:13px_16px] rounded-[16px] text-gf-brown-700 font-medium text-[15px] bg-transparent border-0 cursor-pointer text-left"
      >
        <LogOut size={20} className="shrink-0" />
        <span>{t.logout}</span>
      </button>
    </nav>
  );
}
