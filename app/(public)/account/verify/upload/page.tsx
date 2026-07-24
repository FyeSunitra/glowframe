'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { getPageText } from '@/lib/menuI18n';

export default function VerifyUploadPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const locale = useAppStore((s) => s.locale);
  const { showToast } = useToast();
  const t = getPageText(locale, 'verifyUpload');

  function handleConfirm() {
    setTimeout(() => {
      setUser({ idVerified: true });
      router.push('/account/verify/success');
    }, 1800);
    router.push('/account/verify/processing');
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['My Account', t.verify, t.idCard]} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="bg-gf-pink-300 rounded-[16px] [padding:20px_24px] [margin:-28px_-28px_22px]">
          <h2 className="[margin:0_0_4px] text-[19px]">{t.idCard}</h2>
          <p className="[margin:0] text-[13.5px] text-gf-brown-800">{t.subtitle}</p>
        </div>

        <div className="bg-gf-brown-800 text-gf-pink-100 rounded-[12px] [padding:12px_16px] text-[12.5px] [margin-bottom:20px] [line-height:1.7]">
          {t.notice}
        </div>

        <div
          onClick={() => showToast(t.uploadToast)}
          className="[border:2px_dashed_var(--gf-brown-300)] rounded-[16px] h-[170px] flex items-center justify-center flex-col gap-[8px] text-gf-muted text-[13px] cursor-pointer bg-gf-pink-100 [margin-bottom:22px]"
        >
          <Plus size={26} className="text-gf-brown-700" />
          <span>{t.uploadLabel}</span>
        </div>

        <div className="flex justify-between">
          <button onClick={() => router.push('/account/verify')} className="bg-transparent [border:1.5px_solid_var(--gf-brown-300)] text-gf-brown-800 rounded-full [padding:13px_26px] font-semibold text-[15px] cursor-pointer">{t.back}</button>
          <button onClick={handleConfirm} className="bg-[#DFF2E0] text-gf-green border-0 rounded-full [padding:13px_26px] font-semibold text-[15px] cursor-pointer">{t.confirm}</button>
        </div>
      </div>
    </div>
  );
}
