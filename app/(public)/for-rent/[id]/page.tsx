'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CameraGlyph } from '@/components/common/CameraGlyph';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';

async function fetchProduct(id: string): Promise<Product> {
  const { data } = await axios.get(`/api/products/${id}`);
  return data.data;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'detail' | 'policy'>('detail');

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });

  if (isLoading || !product) {
    return <div className="[padding:60px] text-gf-muted">กำลังโหลด…</div>;
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['ทั้งหมด', product.name]} />
      <div className="grid grid-cols-[300px_1fr] items-start gap-[26px] max-[900px]:grid-cols-1">
        {/* Left: hero */}
        <div className="bg-gf-pink-100 rounded-[22px] [padding:26px] text-center">
          <div className="bg-white rounded-[14px] [padding:12px] font-bold text-[13.5px] [margin-bottom:16px] [box-shadow:var(--gf-shadow-sm)]">{product.name}</div>
          <div className="[margin:20px_0]">
            <CameraGlyph color={product.color} size={130} />
          </div>
          <Link
            href={`/for-rent/${id}/booking`}
            className="block bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:13px_26px] font-semibold text-[15px] cursor-pointer no-underline text-center"
          >
            ส่งคำขอเช่าสินค้า
          </Link>
        </div>

        {/* Right: details */}
        <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] overflow-hidden">
          <div className="[padding:24px_28px_0]">
            <h2 className="[margin:0_0_4px] text-[20px]">{product.name}</h2>
            <p className="text-gf-muted text-[13.5px] [margin:0_0_18px]">{product.desc}</p>
            {/* Pill tabs */}
            <div className="flex gap-[8px] bg-gf-pink-100 [padding:6px] rounded-full [margin-bottom:20px] w-[fit-content]">
              {(['detail', 'policy'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'cursor-pointer rounded-full border-0 px-5 py-2.5 text-sm font-semibold',
                    tab === t ? 'bg-gf-pink-500 text-gf-brown-900' : 'bg-transparent text-gf-brown-700',
                  )}
                >
                  {t === 'detail' ? 'รายละเอียดสินค้าเพิ่มเติม' : 'มาตรการการเช่าสินค้า'}
                </button>
              ))}
            </div>
          </div>
          <div className="[padding:0_28px_28px]">
            {tab === 'detail' ? (
              <>
                <b className="text-[14.5px]">อุปกรณ์</b>
                <ul className="text-gf-brown-700 text-[14px] [line-height:2] [margin-top:8px]">
                  <li>{product.name} จำนวน 1 เครื่อง</li>
                  <li>แบตเตอรี่</li>
                  <li>ที่ชาร์จแบตเตอรี่</li>
                  <li>เมมโมรี่การ์ด</li>
                  <li>ตัวอ่านการ์ด (Card Reader) สำหรับดึงรูปภาพ</li>
                </ul>
              </>
            ) : (
              <ul className="text-gf-brown-700 text-[14px] [line-height:2] [margin-top:8px]">
                <li>ระยะเวลาการเช่าเริ่มนับตั้งแต่ 10:00 น. ของวันรับอุปกรณ์</li>
                <li>กรุณาคืนอุปกรณ์ก่อนเวลา 10:00 น. ของวันคืนที่เลือก</li>
                <li>หากต้องการขยายระยะเวลาการเช่า กรุณาติดต่อ GlowFrame ล่วงหน้าก่อนถึงกำหนดคืน</li>
                <li>การคืนอุปกรณ์ล่าช้าอาจมีค่าปรับตามเงื่อนไขของ GlowFrame</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
