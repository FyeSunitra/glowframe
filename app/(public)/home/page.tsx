'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { DollarSign, Camera } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { getPageText } from '@/lib/menuI18n';

export default function HomePage() {
  const t = getPageText(useAppStore((s) => s.locale), 'home');

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['Home']} />
      <div className="grid grid-cols-2 gap-[22px] max-[900px]:grid-cols-1">
        <div className="bg-gf-brown-800 rounded-[22px] text-gf-pink-100 [padding:44px_30px] text-center relative overflow-hidden">
          <div className="opacity-[0.6] text-[14px]">{t.ownerEyebrow}</div>
          <h2 className="font-[var(--font-poppins)] [font-style:italic] font-semibold text-[26px] [margin:6px_0_22px]">{t.ownerHeadline}</h2>
          <div className="w-[74px] h-[74px] [margin:0_auto_22px] text-gf-pink-300">
            <DollarSign size={74} strokeWidth={1.2} />
          </div>
          <Link href="/list-camera" className="text-[19px] font-bold underline text-[#f6dbe0]">{t.ownerCta}</Link>
          <p className="[margin-top:10px] text-[13px] opacity-[0.65]">{t.ownerSub}</p>
        </div>

        <div className="bg-gf-brown-800 rounded-[22px] text-gf-pink-100 [padding:44px_30px] text-center relative overflow-hidden">
          <div className="opacity-[0.6] text-[14px]">{t.renterEyebrow}</div>
          <h2 className="font-[var(--font-poppins)] [font-style:italic] font-semibold text-[26px] [margin:6px_0_22px]">{t.renterHeadline}</h2>
          <div className="w-[74px] h-[74px] [margin:0_auto_22px] text-gf-pink-300">
            <Camera size={74} strokeWidth={1.2} />
          </div>
          <Link href="/for-rent" className="text-[19px] font-bold underline text-[#f6dbe0]">{t.renterCta}</Link>
          <p className="[margin-top:10px] text-[13px] opacity-[0.65]">{t.renterSub}</p>
        </div>
      </div>
    </div>
  );
}
