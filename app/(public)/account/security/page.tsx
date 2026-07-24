'use client';

import { useToast } from '@/hooks/useToast';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { AccountTabs } from '../AccountTabs';
import { useAppStore } from '@/store/appStore';

export default function AccountSecurityPage() {
  const user = useAppStore((s) => s.user);
  const { showToast } = useToast();

  const items = [
    { icon: '🔒', name: 'ตั้งรหัสผ่าน', sub: 'ยังไม่ได้ตั้งรหัสผ่าน', onClick: () => showToast('เปิดหน้าตั้งรหัสผ่าน (จำลอง)') },
    { icon: '✉️', name: 'เปลี่ยนอีเมล', sub: user.emailVerified ? 'ยืนยันอีเมลเรียบร้อยแล้ว' : 'ยังไม่ได้ยืนยันอีเมล', onClick: () => showToast('เปิดหน้าเปลี่ยนอีเมล (จำลอง)') },
    { icon: '📞', name: 'เปลี่ยนเบอร์โทรศัพท์', sub: user.phoneVerified ? 'ยืนยันเบอร์โทรศัพท์เรียบร้อยแล้ว' : 'ยังไม่ได้ยืนยันเบอร์โทรศัพท์', onClick: () => showToast('เปิดหน้าเปลี่ยนเบอร์โทรศัพท์ (จำลอง)') },
  ];

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['My Account', 'ความปลอดภัย']} />
      <AccountTabs active="security" />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:20px]">ความปลอดภัย</div>
        {items.map((item) => (
          <div key={item.name} onClick={item.onClick} className="flex items-center gap-[16px] [padding:14px_10px] rounded-[14px] cursor-pointer">
            <div className="w-[52px] h-[52px] rounded-[12px] bg-gf-pink-100 flex items-center justify-center shrink-0 text-[22px]">{item.icon}</div>
            <div>
              <div className="font-semibold text-[14.5px] text-gf-brown-900">{item.name}</div>
              <div className="text-[13px] text-gf-muted [margin-top:2px]">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
