'use client';

import Link from 'next/link';
import { CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { getPageText } from '@/lib/menuI18n';

export default function BookingConfirmedPage() {
  const booking = useAppStore((s) => s.booking);
  const t = getPageText(useAppStore((s) => s.locale), 'transaction');
  const catalogText = getPageText(useAppStore((s) => s.locale), 'catalog');

  const { data: product } = useQuery<Product>({
    queryKey: ['product', booking.productId],
    queryFn: async () => (await axios.get(`/api/products/${booking.productId}`)).data.data,
    enabled: !!booking.productId,
  });

  const name = product?.name ?? '—';

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[catalogText.allProducts, name, t.summary, booking.paymentStatus === 'pending_review' ? t.pendingTitle : t.confirmedTitle]} />
      <div className="bg-gf-pink-100 rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px] text-center">
        <div className={cn('mx-auto mb-[22px] size-[82px]', booking.paymentStatus === 'pending_review' ? 'text-gf-yellow' : 'text-gf-green')}>
          {booking.paymentStatus === 'pending_review'
            ? <Clock size={82} strokeWidth={1.4} />
            : <CheckCircle2 size={82} strokeWidth={1.4} />}
        </div>
        <h2 className="text-[20px] font-bold text-gf-brown-900 [margin:0_0_10px]">
          {booking.paymentStatus === 'pending_review' ? t.pendingTitle : t.confirmedTitle}
        </h2>
        {booking.paymentStatus === 'pending_review' && (
          <p className="text-gf-brown-700 text-[13.5px] max-w-[460px] [margin:0_auto_10px] [line-height:1.6]">
            {t.pendingDescription}
          </p>
        )}
        <p className="text-gf-brown-700 text-[13.5px]">
          {t.noBooking} {booking.bookingNo ?? 'XXXXXX-XX'}
        </p>
        <p className="font-bold text-gf-brown-900 [margin:16px_0_4px]">{name}</p>
        <p className="text-gf-brown-700 text-[14px]">
          {t.rentalPeriod}: {booking.days ?? 1} {t.days}
        </p>
        {booking.startDate && (
          <p className="text-gf-brown-700 text-[14px]">
            {t.dates}: {booking.startDate} - {booking.endDate}
          </p>
        )}
        {booking.paymentProofName && (
          <p className="text-gf-muted text-[13px]">
            {t.proofUploaded}: {booking.paymentProofName}
          </p>
        )}
        <p className="text-gf-brown-700 text-[14px] [margin-bottom:20px]">
          {t.returnBefore}
        </p>
        <p className="font-[var(--font-caveat)] text-[24px] text-gf-brown-800">
          {t.thankYou}
        </p>
        <div className="[margin-top:20px]">
          <Link href="/for-rent" className="inline-block bg-gf-brown-800 text-gf-pink-100 border-0 rounded-full [padding:13px_26px] font-semibold text-[15px] no-underline">
            {t.backToProducts}
          </Link>
        </div>
      </div>
    </div>
  );
}
