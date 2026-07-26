'use client';

import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useAppStore } from '@/store/appStore';
import { getPageText } from '@/lib/menuI18n';
import { BrandLogo } from '@/components/common/BrandLogo';

export default function AboutPage() {
  const t = getPageText(useAppStore((s) => s.locale), 'about');

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['About GlowFrame']} />
      <div className="grid grid-cols-1 items-start gap-6 rounded-[22px] bg-white p-5 [box-shadow:var(--gf-shadow)] sm:p-7 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <div className="flex justify-center lg:sticky lg:top-6">
          <BrandLogo variant="about" />
        </div>

        <div className="min-w-0">
          <h1 className="m-0 mb-4 font-[var(--font-poppins)] text-[24px] font-semibold text-gf-brown-900 sm:text-[28px]">
            GlowFrame
          </h1>
          {t.paragraphs.map((text) => (
            <p key={text} className="text-[14px] leading-7 text-gf-brown-700 sm:text-[14.5px] sm:leading-[1.9]">
              {text}
            </p>
          ))}
          <p className="mb-0 text-[14px] font-semibold leading-7 text-gf-brown-900 sm:text-[14.5px] sm:leading-[1.9]">
            {t.closing}
          </p>
        </div>
      </div>
    </div>
  );
}
