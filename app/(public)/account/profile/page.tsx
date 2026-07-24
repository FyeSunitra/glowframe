'use client';

import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { AccountTabs } from '../AccountTabs';

export default function AccountProfilePage() {
  const { user, setUser } = useAppStore((s) => ({ user: s.user, setUser: s.setUser }));
  const { showToast } = useToast();

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['My Account', 'โปรไฟล์']} />
      <AccountTabs active="profile" />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:20px] flex items-center gap-[10px]">
          รายละเอียดโปรไฟล์
        </div>
        <div className="mb-5 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
          <Field label="ชื่อที่แสดง">
            <input placeholder="ชื่อที่แสดง" value={user.displayName} onChange={(e) => setUser({ displayName: e.target.value })} className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
          </Field>
          <Field label="ชื่อ-สกุลผู้ใช้งาน">
            <input placeholder="ชื่อ-สกุล" value={user.fullName} onChange={(e) => setUser({ fullName: e.target.value })} className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
          </Field>
        </div>
        <button
          onClick={() => showToast('บันทึกโปรไฟล์เรียบร้อยแล้ว')}
          className="cursor-pointer rounded-full border-0 bg-gf-brown-800 px-[26px] py-[13px] text-[15px] font-semibold text-gf-pink-100"
        >
          บันทึกการเปลี่ยนแปลง
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13.5px] font-semibold text-gf-brown-800 [margin-bottom:8px]">{label}</label>
      {children}
    </div>
  );
}
