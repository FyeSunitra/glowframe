'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { AccountTabs } from '../AccountTabs';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';

export default function AccountAddressPage() {
  const { addresses, addAddress, removeAddress } = useAppStore((s) => ({
    addresses: s.addresses, addAddress: s.addAddress, removeAddress: s.removeAddress,
  }));
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [detail, setDetail] = useState('');

  function save() {
    const fullDetail = detail.trim() || 'ยังไม่ได้ระบุรายละเอียด';
    addAddress({ label: label.trim() || 'ที่อยู่จัดส่ง', detail: fullDetail + (phone ? ` · โทร ${phone}` : '') });
    showToast('เพิ่มที่อยู่จัดส่งเรียบร้อยแล้ว');
    setLabel(''); setPhone(''); setDetail(''); setFormOpen(false);
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['My Account', 'ที่อยู่จัดส่ง']} />
      <AccountTabs active="address" />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:20px]">ที่อยู่จัดส่ง</div>

        {addresses.map((a) => (
          <div key={a.id} className="[border:1.5px_solid_var(--gf-line)] rounded-[16px] [padding:16px_18px] flex justify-between items-start gap-[14px] [margin-bottom:12px]">
            <div>
              <h4 className="[margin:0_0_4px] text-[14.5px]">{a.label}</h4>
              <p className="[margin:0] text-[13px] text-gf-muted [line-height:1.6]">{a.detail}</p>
            </div>
            <button onClick={() => { removeAddress(a.id); showToast('ลบที่อยู่แล้ว'); }} className="bg-transparent [border:1.5px_solid_var(--gf-brown-300)] text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer flex items-center gap-[6px]">
              <Trash2 size={14} /> ลบ
            </button>
          </div>
        ))}

        {/* Add address box */}
        <div onClick={() => setFormOpen(true)} className="[border:2px_dashed_var(--gf-brown-300)] rounded-[18px] [padding:40px] text-center text-gf-muted cursor-pointer text-[14.5px] font-semibold bg-gf-pink-100 flex items-center justify-center gap-[8px]">
          <Plus size={18} /> เพิ่มที่อยู่จัดส่ง
        </div>

        {formOpen && (
          <div className="[margin-top:20px]">
            <div className="mb-4 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
              <Field label="ชื่อที่อยู่">
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น บ้าน, ที่ทำงาน" className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
              </Field>
              <Field label="เบอร์โทรศัพท์">
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08X-XXX-XXXX" className="w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
              </Field>
            </div>
            <Field label="รายละเอียดที่อยู่">
              <textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" className="min-h-[90px] w-full resize-y rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none" />
            </Field>
            <button onClick={save} className="bg-gf-brown-800 text-gf-pink-100 border-0 rounded-full [padding:13px_26px] font-semibold text-[15px] cursor-pointer">บันทึกที่อยู่</button>
          </div>
        )}
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
