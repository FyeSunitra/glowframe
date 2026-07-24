'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';

export default function VerifySuccessPage() {
  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['สำเร็จ']} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:50px_20px] text-center">
        <div className="text-gf-green w-[82px] h-[82px] [margin:0_auto_22px]">
          <CheckCircle2 size={82} strokeWidth={1.4} />
        </div>
        <h2 className="text-[20px] font-bold text-gf-brown-900 [margin:0_0_10px]">การยืนยันตัวตนเสร็จสมบูรณ์</h2>
        <p className="text-[13.5px] text-gf-muted [line-height:1.7] max-w-[420px] [margin:0_auto]">
          บัญชีของคุณได้รับการตรวจสอบและอนุมัติเรียบร้อยแล้ว
        </p>
        <div className="[margin-top:26px]">
          <Link href="/account/verify" className="inline-block bg-gf-brown-800 text-gf-pink-100 border-0 rounded-full [padding:13px_26px] font-semibold text-[15px] no-underline">
            ไปต่อ
          </Link>
        </div>
      </div>
    </div>
  );
}
