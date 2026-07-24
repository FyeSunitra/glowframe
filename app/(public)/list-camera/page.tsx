'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Package } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CameraGlyph } from '@/components/common/CameraGlyph';
import { useAppStore } from '@/store/appStore';
import { money } from '@/lib/utils';

export default function ListCameraPage() {
  const myListings = useAppStore((s) => s.myListings);
  const router = useRouter();

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['Home', 'ปล่อยเช่ากล้อง']} />
      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        {myListings.length > 0 ? (
          <>
            <div className="flex items-center gap-[10px] text-[19px] font-bold text-gf-brown-900 [margin-bottom:6px]">
              <Package size={20} /> สินค้าของฉัน
            </div>
            {myListings.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/for-rent/${p.id}`)}
                className="flex items-center gap-[16px] [padding:14px_10px] rounded-[14px] cursor-pointer"
              >
                <div className="w-[52px] h-[52px] rounded-[12px] bg-gf-pink-100 flex items-center justify-center shrink-0">
                  <CameraGlyph color={p.color} size={28} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[14.5px] text-gf-brown-900">{p.name}</div>
                  <div className="text-[13px] text-gf-muted [margin-top:2px]">{money(p.price)} THB / 1 Day</div>
                </div>
              </div>
            ))}
            <div className="[margin-top:16px]">
              <Link href="/list-camera/add" className="inline-flex items-center gap-[8px] bg-transparent [border:1.5px_solid_var(--gf-brown-300)] text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold no-underline">
                <Plus size={16} /> เพิ่มสินค้า
              </Link>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center [padding:60px_0]">
            <Link href="/list-camera/add" className="inline-flex items-center gap-[8px] bg-gf-pink-100 text-gf-brown-800 border-0 rounded-[20px] [padding:22px_34px] text-[15px] font-semibold no-underline">
              <Plus size={18} /> เพิ่มสินค้า
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
