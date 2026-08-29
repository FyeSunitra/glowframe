'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarRange,
  Home,
  Images,
  Info,
  LogOut,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getMenuText } from '@/lib/menuI18n';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth';

const PUBLIC_NAV_ITEMS = [
  { href: '/home', labelKey: 'home', icon: Home },
  { href: '/about', labelKey: 'about', icon: Info },
  { href: '/photobooth', labelKey: 'photobooth', icon: Images },
];

const AUTHENTICATED_NAV_ITEMS = [
  { href: '/home', labelKey: 'home', icon: Home },
  { href: '/about', labelKey: 'about', icon: Info },
  { href: '/photobooth', labelKey: 'photobooth', icon: Images },
  { href: '/rentals', labelKey: 'myRentals', icon: CalendarRange },
  { href: '/wallet', labelKey: 'wallet', icon: Wallet },
  { href: '/account/profile', labelKey: 'myAccount', icon: UserRound },
];

/** Which sidebar key is "active" for nested routes */
function activeKey(pathname: string): string {
  if (pathname.startsWith('/home'))         return '/home';
  if (pathname.startsWith('/about'))        return '/about';
  if (pathname.startsWith('/for-rent') || pathname.startsWith('/transaction') || pathname.startsWith('/booking-confirmed'))
    return '/home';
  if (pathname.startsWith('/photobooth'))     return '/photobooth';
  if (pathname.startsWith('/rentals'))        return '/rentals';
  if (pathname.startsWith('/list-camera'))    return '/list-camera';
  if (pathname.startsWith('/wallet'))         return '/wallet';
  if (pathname.startsWith('/account'))        return '/account/profile';
  return '/home';
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = getMenuText(useAppStore((s) => s.locale));
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const logout = useAppStore((s) => s.logout);
  const active = activeKey(pathname);
  const navItems = isAuthenticated ? AUTHENTICATED_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  async function handleLogout() {
    await authService.logout();
    logout();
    router.replace('/home');
    router.refresh();
  }

  return (
    <nav className="flex w-[250px] shrink-0 flex-col gap-1.5 px-[18px] py-[26px] max-[900px]:w-full max-[900px]:flex-row max-[900px]:overflow-x-auto max-[900px]:overflow-y-visible max-[900px]:border-b max-[900px]:border-gf-line max-[900px]:px-3.5 max-[900px]:py-3 [&_a]:max-[900px]:whitespace-nowrap [&_button]:max-[900px]:whitespace-nowrap">
      {navItems.map(({ href, labelKey, icon: Icon }) => {
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
      {isAuthenticated && (
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full cursor-pointer items-center gap-[13px] rounded-[16px] border-0 bg-transparent px-4 py-[13px] text-left text-[15px] font-medium text-gf-brown-700 transition-colors hover:bg-gf-pink-100"
        >
          <LogOut size={20} className="shrink-0" />
          <span>{t.logout}</span>
        </button>
      )}
    </nav>
  );
}
