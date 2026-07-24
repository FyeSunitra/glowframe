'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ShieldCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { cn, productColor } from '@/lib/utils';
import type { Product } from '@/types';

export default function AddProductPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { addProduct: form, setAddProduct, resetAddProduct, addMyListing, addresses, user } = useAppStore((s) => ({
    addProduct: s.addProduct, setAddProduct: s.setAddProduct,
    resetAddProduct: s.resetAddProduct, addMyListing: s.addMyListing,
    addresses: s.addresses,
    user: s.user,
  }));

  const [step, setStep] = useState<1 | 2>(1);
  const [processing, setProcessing] = useState(false);

  function goStep2() {
    if (!user.idVerified || user.suspended) { showToast('Identity verification is required before listing a camera'); return; }
    if (!form.name.trim()) { showToast('กรุณากรอกชื่อสินค้า'); return; }
    setStep(2);
  }

  function submit() {
    if (!user.idVerified || user.suspended) { showToast('Identity verification is required before listing a camera'); return; }
    if (!form.name.trim()) { showToast('กรุณากรอกชื่อสินค้า'); setStep(1); return; }
    setProcessing(true);
    const id = Date.now();
    const newProduct: Product = {
      id, name: form.name,
      desc: form.desc || 'ไม่มีคำอธิบายเพิ่มเติม',
      price: Number(form.price) || 0,
      deposit: Number(form.deposit) || 0,
      color: productColor(id),
      rating: 5,
      status: 'pending',
    };
    addMyListing(newProduct);
    resetAddProduct();
    // Simulate processing then success
    setTimeout(() => { router.push('/list-camera/add/success'); }, 1800);
  }

  if (processing) {
    return (
      <div className="animate-fade-up">
        <Breadcrumb items={['Home', 'ปล่อยเช่ากล้อง', 'เพิ่มสินค้า']} />
        <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:50px_20px] text-center">
          <div className="text-gf-yellow w-[82px] h-[82px] [margin:0_auto_22px]">
            <ShieldIcon />
          </div>
          <h2 className="text-[20px] font-bold text-gf-brown-900 [margin:0_0_10px]">เราได้รับสินค้าของคุณแล้ว</h2>
          <p className="text-[13.5px] text-gf-muted [line-height:1.7] max-w-[420px] [margin:0_auto]">
            ระบบกำลังตรวจสอบข้อมูลเพื่อความปลอดภัยของผู้ใช้งาน เมื่ออนุมัติแล้ว คุณจะสามารถใช้บริการปล่อยเช่ากับ GlowFrame ได้ทันที
          </p>
          <div className="[margin-top:26px]">
            <span className="bg-gf-pink-100 text-gf-brown-800 rounded-full [padding:8px_16px] text-[13px] font-semibold">
              กำลังประมวลผล…
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['Home', 'ปล่อยเช่ากล้อง', 'เพิ่มสินค้า']} />

      {(!user.idVerified || user.suspended) && (
        <div className="bg-gf-pink-100 rounded-[22px] [box-shadow:var(--gf-shadow-sm)] [padding:18px] [margin-bottom:20px] flex items-center gap-[12px]">
          <ShieldCheck size={22} className="text-gf-brown-700 shrink-0" />
          <div className="flex-1 text-[13.5px] text-gf-brown-700 [line-height:1.6]">
            Owners must complete identity verification before submitting a camera for admin approval.
          </div>
          <button onClick={() => router.push('/account/verify')} className={OUTLINE_BTN_CLASS}>Verify now</button>
        </div>
      )}

      {step === 1 && (
        <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
          <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:6px]">รายละเอียดสินค้า</div>
          <p className="text-[13.5px] text-gf-muted [margin:0_0_20px] [line-height:1.6]">
            ระบุข้อมูลสินค้าของคุณพร้อมคำอธิบายที่ครบถ้วน เพื่อช่วยให้ผู้เช่าตัดสินใจได้ง่ายขึ้น
          </p>
          {/* Upload boxes */}
          <div className="mb-[22px] grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
            {['เพิ่มภาพสินค้า', 'เพิ่มวิดีโอสินค้า'].map((label) => (
              <div key={label} onClick={() => showToast(`${label} (จำลอง)`)} className={UPLOAD_BOX_CLASS}>
                <Plus size={24} /><span>{label}</span>
              </div>
            ))}
          </div>
          <div onClick={() => showToast('เพิ่มรูปภาพสินค้าเพิ่มเติม (จำลอง)')} className={cn(UPLOAD_BOX_CLASS, 'mb-[22px]')}>
            <Plus size={24} /><span>เพิ่มรูปภาพสินค้าเพิ่มเติม</span>
          </div>

          <Field label="ชื่อสินค้า">
            <input className={cn('gf-input', INPUT_CLASS)} maxLength={20} placeholder="ชื่อสินค้า (โดยไม่เกิน 20 ตัวอักษร)" value={form.name} onChange={(e) => setAddProduct({ name: e.target.value })} />
          </Field>
          <Field label="รายละเอียดสินค้า">
            <textarea placeholder="อธิบายอุปกรณ์ อุปกรณ์เสริมที่แถม และสภาพการใช้งาน" value={form.desc} onChange={(e) => setAddProduct({ desc: e.target.value })} className={cn(INPUT_CLASS, 'min-h-[90px] resize-y')} />
          </Field>
          <Field label="เพิ่มเติม">
            <textarea placeholder="เงื่อนไขเพิ่มเติม (ถ้ามี)" value={form.extra} onChange={(e) => setAddProduct({ extra: e.target.value })} className={cn(INPUT_CLASS, 'min-h-[90px] resize-y')} />
          </Field>

          <div className="flex justify-end [margin-top:26px]">
            <button onClick={goStep2} className={DARK_BTN_CLASS}>ถัดไป</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <>
          <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
            <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:6px]">ราคาและมัดจำ</div>
            <p className="text-[13.5px] text-gf-muted [margin:0_0_20px] [line-height:1.6]">
              ระบุราคาเช่าที่น่าสนใจและเงินมัดจำที่เหมาะสม
            </p>
            <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
              <Field label="ราคาเฉลี่ยต่อวัน">
                <div className="relative">
                  <input type="number" placeholder="0" value={form.price} onChange={(e) => setAddProduct({ price: e.target.value })} className={cn(INPUT_CLASS, 'pr-[52px]')} />
                  <span className="absolute right-[16px] top-[50%] [transform:translateY(-50%)] text-gf-muted text-[13px] font-semibold">THB</span>
                </div>
              </Field>
              <Field label="มัดจำ">
                <div className="relative">
                  <input type="number" placeholder="0" value={form.deposit} onChange={(e) => setAddProduct({ deposit: e.target.value })} className={cn(INPUT_CLASS, 'pr-[52px]')} />
                  <span className="absolute right-[16px] top-[50%] [transform:translateY(-50%)] text-gf-muted text-[13px] font-semibold">THB</span>
                </div>
              </Field>
            </div>
          </div>

          <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px] [margin-top:20px]">
            <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:6px]">ที่อยู่ในการจัดส่ง</div>
            <p className="text-[13.5px] text-gf-muted [margin:0_0_20px] [line-height:1.6]">
              ระบุที่อยู่ในการจัดส่งให้ชัดเจน
            </p>
            {addresses.length > 0 ? addresses.map((a) => (
              <div key={a.id} onClick={() => setAddProduct({ addressId: a.id })} className={cn(
                'mb-2.5 flex cursor-pointer items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-[13px]',
                form.addressId === a.id ? 'border-gf-brown-800 bg-gf-pink-100' : 'border-gf-line bg-transparent',
              )}>
                <div className={cn(
                  'relative size-[18px] shrink-0 rounded-full border-2',
                  form.addressId === a.id ? 'border-gf-brown-800' : 'border-gf-brown-300',
                )}>
                  {form.addressId === a.id && <div className="absolute [inset:3px] rounded-full bg-gf-brown-800" />}
                </div>
                <div><b>{a.label}</b><br /><span className="text-gf-muted text-[13px]">{a.detail}</span></div>
              </div>
            )) : (
              <div onClick={() => router.push('/account/address')} className="[border:2px_dashed_var(--gf-brown-300)] rounded-[18px] [padding:40px] text-center text-gf-muted cursor-pointer text-[14.5px] font-semibold bg-gf-pink-100 flex items-center justify-center gap-[8px]">
                <Plus size={18} /> เพิ่มที่อยู่จัดส่ง
              </div>
            )}
          </div>

          <div className="flex justify-between [margin-top:26px]">
            <button onClick={() => setStep(1)} className={OUTLINE_BTN_CLASS}>← ย้อนกลับ</button>
            <button onClick={submit} className={DARK_BTN_CLASS}>เพิ่มสินค้า</button>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="[margin-bottom:18px]">
      <label className="block text-[13.5px] font-semibold text-gf-brown-800 [margin-bottom:8px]">{label}</label>
      {children}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={82} height={82}>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
    </svg>
  );
}

const INPUT_CLASS = 'w-full rounded-[14px] border-[1.5px] border-gf-line bg-gf-cream px-4 py-[13px] text-[14.5px] text-gf-ink outline-none';
const UPLOAD_BOX_CLASS = 'flex h-[118px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-gf-brown-300 bg-gf-pink-100 text-[13px] text-gf-muted';
const DARK_BTN_CLASS = 'cursor-pointer rounded-full border-0 bg-gf-brown-800 px-[26px] py-[13px] text-[15px] font-semibold text-gf-pink-100';
const OUTLINE_BTN_CLASS = 'cursor-pointer rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-800';
