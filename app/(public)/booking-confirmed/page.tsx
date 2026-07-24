'use client';

import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export default function BookingConfirmedPage() {
  const booking = useAppStore((s) => s.booking);

  const { data: product } = useQuery<Product>({
    queryKey: ['product', booking.productId],
    queryFn: async () => (await axios.get(`/api/products/${booking.productId}`)).data.data,
    enabled: !!booking.productId,
  });

  const name = product?.name ?? '—';

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={['ทั้งหมด', name, 'รายการธุรกรรม', 'รายการเสร็จสิ้น']} />
      <div className="bg-gf-pink-100 rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px] text-center">
        <div className={cn('mx-auto mb-[22px] size-[82px]', booking.paymentStatus === 'pending_review' ? 'text-gf-yellow' : 'text-gf-green')}>
          {booking.paymentStatus === 'pending_review'
            ? <Clock size={82} strokeWidth={1.4} />
            : <CheckCircle2 size={82} strokeWidth={1.4} />}
        </div>
        <h2 className="text-[20px] font-bold text-gf-brown-900 [margin:0_0_10px]">
          {booking.paymentStatus === 'pending_review' ? 'Payment Evidence Submitted' : 'Your Booking is Confirmed'}
        </h2>
        {booking.paymentStatus === 'pending_review' && (
          <p className="text-gf-brown-700 text-[13.5px] max-w-[460px] [margin:0_auto_10px] [line-height:1.6]">
            Your rental request is waiting for admin payment review. It will become Payment Successful only after the evidence is approved.
          </p>
        )}
        <p className="text-gf-brown-700 text-[13.5px]">
          No. Booking {booking.bookingNo ?? 'XXXXXX-XX'}
        </p>
        <p className="font-bold text-gf-brown-900 [margin:16px_0_4px]">{name}</p>
        <p className="text-gf-brown-700 text-[14px]">
          Rental Period : {booking.days ?? 1} Days
        </p>
        {booking.startDate && (
          <p className="text-gf-brown-700 text-[14px]">
            Dates : {booking.startDate} - {booking.endDate}
          </p>
        )}
        {booking.paymentProofName && (
          <p className="text-gf-muted text-[13px]">
            Proof uploaded : {booking.paymentProofName}
          </p>
        )}
        <p className="text-gf-brown-700 text-[14px] [margin-bottom:20px]">
          คืนอุปกรณ์ก่อนเวลา 10:00 น. ของวันคืนที่กำหนด
        </p>
        <p className="font-[var(--font-caveat)] text-[24px] text-gf-brown-800">
          Thank you for choosing GlowFrame. ✨
        </p>
        <div className="[margin-top:20px]">
          <Link href="/for-rent" className="inline-block bg-gf-brown-800 text-gf-pink-100 border-0 rounded-full [padding:13px_26px] font-semibold text-[15px] no-underline">
            กลับไปหน้าสินค้าทั้งหมด
          </Link>
        </div>
      </div>
    </div>
  );
}
