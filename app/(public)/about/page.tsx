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
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px] grid [grid-template-columns:280px_1fr] gap-[34px] [align-items:start]">
        <div className="flex justify-center">
          <BrandLogo variant="about" />
        </div>

        <div>
          <h2 className="font-[var(--font-poppins)] [margin-top:0]">GlowFrame</h2>
          {t.paragraphs.map((text) => (
            <p key={text} className="text-gf-brown-700 [line-height:1.9] text-[14.5px]">{text}</p>
          ))}
          <p className="font-semibold text-gf-brown-900 [line-height:1.9] text-[14.5px]">
            {t.closing}
          </p>
        </div>
      </div>
    </div>
  );
}
