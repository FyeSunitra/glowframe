'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Upload, ShieldCheck } from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { cn, money, genBookingNo } from '@/lib/utils';
import type { Product } from '@/types';
import { getPageText } from '@/lib/menuI18n';

const DAY_MAP: Record<string, { d: number; mult: number }> = {
  '1': { d: 1, mult: 1 }, '3': { d: 3, mult: 2.8 }, '5': { d: 5, mult: 4.6 }, custom: { d: 1, mult: 1 },
};
export default function TransactionPage() {
  const router = useRouter();
  const t = getPageText(useAppStore((s) => s.locale), 'transaction');
  const bookingText = getPageText(useAppStore((s) => s.locale), 'booking');
  const { showToast } = useToast();
  const { booking, txnPay, setTxnPay, setBooking, user } = useAppStore((s) => ({
    booking: s.booking,
    txnPay: s.txnPay,
    setTxnPay: s.setTxnPay,
    setBooking: s.setBooking,
    user: s.user,
  }));

  const { data: product } = useQuery<Product>({
    queryKey: ['product', booking.productId],
    queryFn: async () => (await axios.get(`/api/products/${booking.productId}`)).data.data,
    enabled: !!booking.productId,
  });

  if (!product) return <div className="[padding:60px] text-gf-muted">{bookingText.loading}</div>;

  const { d: days, mult } = DAY_MAP[booking.dayOption];
  const rentalPrice = Math.round(product.price * mult);
  const deliveryFee = booking.delivery === 'post' ? 60 : 0;
  const deposit = product.deposit;
  const total = rentalPrice + deliveryFee + deposit;
  const verificationBlocked = !user.emailVerified || user.suspended;
  const canSubmit = !!txnPay.method && txnPay.agree && !!booking.paymentProofName && !verificationBlocked;
  const deliveryLabels: Record<string, string> = {
    pickup: bookingText.pickup,
    grab: bookingText.messenger,
    post: bookingText.shipping,
  };

  function confirmPaymentEvidence() {
    setBooking({
      total,
      days,
      bookingNo: booking.bookingNo ?? genBookingNo(),
      paymentStatus: 'pending_review',
    });
    router.push('/booking-confirmed');
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[bookingText.forRent, product.name, t.paymentEvidence]} />

      {verificationBlocked && (
        <div className="bg-gf-pink-100 rounded-[22px] [box-shadow:var(--gf-shadow-sm)] [padding:18px] [margin-bottom:20px] flex items-center gap-[12px]">
          <ShieldCheck size={22} className="text-gf-brown-700 shrink-0" />
          <div className="flex-1 text-[13.5px] text-gf-brown-700 [line-height:1.6]">
            {t.emailRequired}
          </div>
          <button onClick={() => router.push('/account/security')} className="cursor-pointer rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-4 py-[9px] text-[13px] font-semibold text-gf-brown-800">{t.reviewAccount}</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-[26px] max-[900px]:grid-cols-1">
        <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
          <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:16px]">{t.uploadTitle}</div>

          {[
            { key: 'qr' as const, title: t.bankTransfer, sub: t.bankTransferSub },
          ].map((opt) => (
            <div key={opt.key} onClick={() => setTxnPay({ method: opt.key })} className={cn(
              'mb-3.5 flex cursor-pointer items-center gap-3.5 rounded-[16px] border-[1.5px] p-[18px]',
              txnPay.method === opt.key ? 'border-gf-brown-800 bg-gf-pink-100' : 'border-gf-line bg-white',
            )}>
              <div className={cn(
                'relative size-[18px] shrink-0 rounded-full border-2',
                txnPay.method === opt.key ? 'border-gf-brown-800' : 'border-gf-brown-300',
              )}>
                {txnPay.method === opt.key && <div className="absolute [inset:3px] rounded-full bg-gf-brown-800" />}
              </div>
              <div>
                <b>{opt.title}</b><br />
                <span className="text-[12.5px] text-gf-muted">{opt.sub}</span>
              </div>
            </div>
          ))}

          <label className="flex items-center justify-center flex-col gap-[8px] [border:2px_dashed_var(--gf-brown-300)] rounded-[16px] min-h-[118px] text-gf-muted bg-gf-pink-100 cursor-pointer text-[13px] [margin-top:12px]">
            <Upload size={24} />
            <span>{booking.paymentProofName ?? t.uploadProof}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setBooking({ paymentProofName: e.target.files?.[0]?.name, paymentStatus: 'not_started' })}
              className="hidden"
            />
          </label>

          <div className="flex gap-[10px] items-start [margin-top:20px] text-[14px] text-gf-brown-700">
            <input
              type="checkbox" id="tc-agree" checked={txnPay.agree}
              onChange={(e) => setTxnPay({ agree: e.target.checked })}
              className="[margin-top:3px]"
            />
            <label htmlFor="tc-agree">
              {t.agreement}
            </label>
          </div>
        </div>

        <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
          <div className="text-[19px] font-bold text-gf-brown-900 [margin-bottom:16px]">{t.summary}</div>
          {[
            { label: `${t.rentalFee}: ${product.name} (${days} ${t.days})`, value: `${money(rentalPrice)} THB` },
            { label: `${t.deliveryFee} (${deliveryLabels[booking.delivery]})`, value: `${money(deliveryFee)} THB` },
            { label: t.securityDeposit, value: `${money(deposit)} THB` },
            { label: t.discount, value: '0 THB' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-[16px] [padding:10px_0] text-[14px] text-gf-brown-800">
              <span>{label}</span><span>{value}</span>
            </div>
          ))}
          <div className="flex justify-between [padding:16px_0_10px] [margin-top:8px] [border-top:1.5px_dashed_var(--gf-line)] font-bold text-[16px]">
            <span>{t.total}</span><span>{money(total)} THB</span>
          </div>
          <button
            onClick={canSubmit ? confirmPaymentEvidence : () => showToast(t.chooseFirst)}
            className={cn(
              'mt-[18px] w-full rounded-full border-0 bg-gf-pink-500 px-[26px] py-[13px] text-[15px] font-semibold text-gf-brown-900',
              canSubmit ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-45',
            )}
          >
            {t.submitReview}
          </button>
        </div>
      </div>
    </div>
  );
}
