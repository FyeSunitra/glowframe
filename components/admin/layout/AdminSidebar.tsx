'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Camera, CalendarCheck, CreditCard, Wallet, Settings, LogOut,
  ShieldCheck, Flag, Tag, Package,
  FileText,
  Layers3,
  AlertTriangle,
  PackageCheck,
  Truck,
  BadgeDollarSign,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useRouter } from 'next/navigation';
import { getMenuText } from '@/lib/menuI18n';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth';

const SECTIONS = [
  {
    label: null,
    items: [
      { href: '/admin/dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    ],
  },
  {
    labelKey: 'core',
    items: [
      { href: '/admin/users',        labelKey: 'users',          icon: Users },
      { href: '/admin/products',     labelKey: 'cameraListings', icon: Camera },
      { href: '/admin/bookings',     labelKey: 'bookings',       icon: CalendarCheck },
      { href: '/admin/transactions', labelKey: 'transactions',   icon: CreditCard },
      { href: '/admin/payouts',      labelKey: 'payouts',        icon: Wallet },
      { href: '/admin/financial/revenue', labelKey: 'revenue', icon: BadgeDollarSign },
    ],
  },
  {
    labelKey: 'trustSafety',
    items: [
      { href: '/admin/trust/kyc',     labelKey: 'kycIdentity', icon: ShieldCheck },
      { href: '/admin/trust/reports', labelKey: 'reports',     icon: Flag },
      { href: '/admin/trust/disputes', labelKey: 'disputes',     icon: AlertTriangle }, // out of scope
      // { href: '/admin/trust/fraud',    labelKey: 'Fraud Signals', icon: Zap },           // out of scope
    ],
  },
  // Financial — out of scope
  // {
  //   label: 'Financial',
  //   items: [
  //     { href: '/admin/financial/refunds',    label: 'Refunds',    icon: RefreshCw },
  //     { href: '/admin/financial/revenue',    label: 'Revenue',    icon: BarChart2 },
  //     { href: '/admin/financial/promotions', label: 'Promotions', icon: Tag },
  //   ],
  // },
  // Communications — out of scope
  // {
  //   label: 'Communications',
  //   items: [
  //     { href: '/admin/comms/announcements',   label: 'Announcements',   icon: Bell },
  //     { href: '/admin/comms/support',         label: 'Support Tickets', icon: LifeBuoy },
  //     { href: '/admin/comms/email-templates', label: 'Email Templates', icon: Mail },
  //   ],
  // },
  // Legal — out of scope (Terms, Privacy Policy, Activity Logs all explicitly out of scope)
  {
    label: 'Legal',
    items: [
      // { href: '/admin/legal/pdpa',  labelKey: 'PDPA Requests',   icon: Scale },
      { href: '/admin/legal/terms', labelKey: 'legal', icon: FileText },
      // { href: '/admin/legal/audit', labelKey: 'Audit Log',        icon: ClipboardList },
    ],
  },
  {
    labelKey: 'operations',
    items: [
      { href: '/admin/operations/returns', labelKey: 'returnOperations', icon: PackageCheck },
      { href: '/admin/operations/delivery', labelKey: 'deliveryOperations', icon: Truck },
    ],
  },
  // Operations — out of scope
  // {
  //   label: 'Operations',
  //   items: [
  //     { href: '/admin/operations/returns',  label: 'Return Reports',    icon: PackageCheck },
  //     { href: '/admin/operations/delivery', label: 'Delivery Tracking', icon: Truck },
  //   ],
  // },
  // Platform — out of scope
  // {
  //   label: 'Platform',
  //   items: [
  //     { href: '/admin/config/feature-flags', label: 'Feature Flags',    icon: ToggleLeft },
  //     { href: '/admin/config/maintenance',   label: 'Maintenance Mode', icon: WrenchIcon },
  //   ],
  // },
  // Analytics — out of scope
  // {
  //   label: 'Analytics',
  //   items: [
  //     { href: '/admin/analytics/demand', label: 'Rental Demand',     icon: TrendingUp },
  //     { href: '/admin/analytics/cohort', label: 'Cohort & Retention', icon: PieChart },
  //   ],
  // },
  {
    labelKey: 'masterData',
    items: [
      { href: '/admin/master/brands',      labelKey: 'cameraBrands',     icon: Tag     },
      { href: '/admin/master/categories',  labelKey: 'cameraCategories', icon: Layers3 },
      { href: '/admin/master/accessories', labelKey: 'accessories',      icon: Package },
    ],
  },
  {
    label: null,
    items: [
      { href: '/admin/settings', labelKey: 'settings', icon: Settings },
    ],
  },
];

function activeKey(pathname: string): string {
  const all = SECTIONS.flatMap(s => s.items).map(i => i.href).sort((a, b) => b.length - a.length);
  return all.find(href => pathname.startsWith(href)) ?? '/admin/dashboard';
}

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAppStore((s) => s.logout);
  const t = getMenuText(useAppStore((s) => s.locale));
  const router = useRouter();
  const active = activeKey(pathname);

  async function handleLogout() {
    await authService.logout();
    logout();
    router.replace('/login');
    router.refresh();
  }

  return (
    <nav className="flex max-h-[calc(100vh-60px)] w-[250px] shrink-0 flex-col gap-1 overflow-y-auto px-[18px] pb-20 pt-[18px] max-[900px]:max-h-none max-[900px]:w-full max-[900px]:flex-row max-[900px]:overflow-x-auto max-[900px]:overflow-y-visible max-[900px]:border-b max-[900px]:border-gf-line max-[900px]:px-3.5 max-[900px]:py-3 [&>div]:max-[900px]:flex [&>div]:max-[900px]:shrink-0 [&>div>div:first-child]:max-[900px]:hidden [&_a]:max-[900px]:whitespace-nowrap [&_button]:max-[900px]:whitespace-nowrap">
      {SECTIONS.map((section, si) => (
        <div key={si}>
          {section.labelKey && (
            <div className="text-[10.5px] font-bold text-gf-muted uppercase [letter-spacing:0.8px] [padding:10px_16px_4px]">
              {t[section.labelKey]}
            </div>
          )}
          {si > 0 && !section.labelKey && (
            <div className="h-[1px] bg-gf-line [margin:6px_6px]" />
          )}
          {section.items.map(({ href, labelKey, icon: Icon }) => {
            const isActive = active === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-[11px] rounded-[14px] px-4 py-2.5 text-[14px] no-underline transition-colors',
                  isActive
                    ? 'bg-gf-brown-300 font-semibold text-gf-brown-900'
                    : 'bg-transparent font-medium text-gf-brown-700',
                )}
              >
                <Icon size={17} className="shrink-0" />
                <span>{t[labelKey]}</span>
              </Link>
            );
          })}
        </div>
      ))}

      <div className="h-[1px] bg-gf-line [margin:6px_6px]" />

      <button
        onClick={() => void handleLogout()}
        className="flex items-center gap-[11px] [padding:10px_16px] rounded-[14px] text-gf-brown-700 font-medium text-[14px] bg-transparent border-0 cursor-pointer text-left"
      >
        <LogOut size={17} className="shrink-0" />
        <span>{t.logout}</span>
      </button>
    </nav>
  );
}
