'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/common/Breadcrumb';

export default function VerifyProcessingPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.push('/account/verify/success'), 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['กำลังตรวจสอบ']} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:50px_20px] text-center">
        <div className="text-gf-yellow w-[82px] h-[82px] [margin:0_auto_22px]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={82} height={82}>
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
          </svg>
        </div>
        <h2 className="text-[20px] font-bold text-gf-brown-900 [margin:0_0_10px]">เราได้รับเอกสารของคุณแล้ว</h2>
        <p className="text-[13.5px] text-gf-muted [line-height:1.7] max-w-[420px] [margin:0_auto]">
          ระบบกำลังตรวจสอบข้อมูลเพื่อความปลอดภัยของผู้ใช้งาน เมื่ออนุมัติแล้ว คุณจะสามารถใช้บริการเช่าและปล่อยเช่ากับ GlowFrame ได้ทันที
        </p>
        <div className="[margin-top:26px]">
          <span className="bg-gf-pink-100 text-gf-brown-800 rounded-full [padding:8px_16px] text-[13px] font-semibold">กำลังประมวลผล…</span>
        </div>
      </div>
    </div>
  );
}
