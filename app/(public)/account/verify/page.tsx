'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { AccountTabs } from '../AccountTabs';
import { useAppStore } from '@/store/appStore';

export default function AccountVerifyPage() {
  const user = useAppStore((s) => s.user);

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['My Account', 'ยืนยันตัวตน']} />
      <AccountTabs active="verify" />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:20px]">การยืนยันตัวตน</div>
        <Link
          href={user.idVerified ? '/account/verify' : '/account/verify/upload'}
          className="flex items-center gap-[16px] [padding:14px_10px] rounded-[14px] cursor-pointer no-underline text-[inherit]"
        >
          <div className="w-[52px] h-[52px] rounded-[12px] bg-gf-pink-100 flex items-center justify-center shrink-0 text-[22px]">🪪</div>
          <div className="flex-1">
            <div className="font-semibold text-[14.5px] text-gf-brown-900">บัตรประชาชน</div>
            <div className="text-[13px] text-gf-muted [margin-top:2px]">
              {user.idVerified ? 'ยืนยันตัวตนเรียบร้อยแล้ว' : 'ยังไม่ได้ยืนยันตัวตน'}
            </div>
          </div>
          {user.idVerified ? (
            <CheckCircle2 size={18} className="text-gf-green shrink-0" />
          ) : (
            <span className="text-[12px] text-gf-brown-700 underline font-semibold">ยืนยันตอนนี้</span>
          )}
        </Link>
      </div>
    </div>
  );
}
