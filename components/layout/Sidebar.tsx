'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  CalendarRange,
  Home,
  Images,
  Info,
  LogOut,
  Menu,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getMenuText } from '@/lib/menuI18n';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await authService.logout();
    logout();
    router.replace('/home');
    router.refresh();
  }

  function renderNavItems(onNavigate?: () => void) {
    return (
      <>
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-[13px] rounded-[16px] px-4 py-[13px] text-[15px] no-underline transition-colors',
                isActive
                  ? 'bg-gf-brown-300 font-semibold text-gf-brown-900'
                  : 'bg-transparent font-medium text-gf-brown-700 hover:bg-gf-pink-100',
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
            onClick={() => {
              onNavigate?.();
              void handleLogout();
            }}
            className="flex w-full cursor-pointer items-center gap-[13px] rounded-[16px] border-0 bg-transparent px-4 py-[13px] text-left text-[15px] font-medium text-gf-brown-700 transition-colors hover:bg-gf-pink-100"
          >
            <LogOut size={20} className="shrink-0" />
            <span>{t.logout}</span>
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <div className="min-[901px]:hidden border-b border-gf-line bg-white px-4 py-2.5">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            title="Navigation"
            className="flex size-10 items-center justify-center rounded-full border border-gf-brown-300 bg-white text-gf-brown-800"
          >
            <Menu size={19} />
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(300px,calc(100vw-44px))] gap-0 bg-white p-0" showCloseButton>
            <SheetHeader className="border-b border-gf-line px-5 py-5">
              <SheetTitle className="text-lg font-bold text-gf-brown-900">GlowFrame</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
              {renderNavItems(() => setMobileMenuOpen(false))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      <nav className="hidden w-[250px] shrink-0 flex-col gap-1.5 px-[18px] py-[26px] min-[901px]:flex">
        {renderNavItems()}
      </nav>
    </>
  );
}
