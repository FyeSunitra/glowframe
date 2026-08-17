'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getMenuText } from '@/lib/menuI18n';
import { BrandLogo } from '@/components/common/BrandLogo';

export function Topbar() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const t = getMenuText(locale);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-[22px] border-b border-gf-line bg-white px-7 py-3.5 max-[900px]:flex-wrap max-[900px]:gap-3 max-[900px]:px-4 max-[900px]:py-3">
      {/* Brand */}
      <Link href="/for-rent" className="flex items-center gap-[10px] no-underline">
        <BrandLogo variant="compact" priority />
      </Link>

      {/* Search */}
      <div className="flex max-w-[420px] flex-1 items-center gap-2.5 rounded-full bg-gf-pink-100 px-[18px] py-[11px] text-sm text-gf-muted max-[900px]:order-3 max-[900px]:w-full max-[900px]:max-w-none max-[900px]:basis-full">
        <Search size={16} />
        <input
          placeholder={t.search}
          className="bg-transparent border-0 outline-none flex-1 text-[14px] text-gf-ink"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3 text-sm text-gf-brown-800 max-[900px]:ml-0">
        <button
          onClick={() => setLocale(locale === 'th' ? 'en' : 'th')}
          className="[border:1px_solid_var(--gf-brown-300)] rounded-full bg-transparent text-gf-brown-800 [padding:7px_11px] text-[12px] font-bold cursor-pointer min-w-[42px]"
          title={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
        >
          {locale === 'th' ? 'EN' : 'TH'}
        </button>
      </div>
    </header>
  );
}
