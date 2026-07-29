'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Building2, QrCode, ShieldCheck, Upload } from 'lucide-react';
import { payloadFor } from '@thai-qr-payment/payload';
import { QRCodeSVG } from 'qrcode.react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { PolicyModal } from '@/components/auth/PolicyModal';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/useToast';
import { unwrapApiResponse } from '@/lib/api';
import { cn, money } from '@/lib/utils';
import type { Product } from '@/types';
import type { RequiredPolicyType } from '@/types/policy';
import { getPageText } from '@/lib/menuI18n';
import { productService } from '@/services/products';
import { paymentService } from '@/services/payment';
import { bookingService } from '@/services/bookings';
import type { PlatformReceivingAccount } from '@/types/payment';

export default function TransactionPage() {
  const [policyType, setPolicyType] = useState<RequiredPolicyType | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
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
    queryFn: async () =>
      unwrapApiResponse(await productService.get(booking.productId!)),
    enabled: !!booking.productId,
  });

  const { data: paymentAccounts = [], isLoading: paymentAccountsLoading } = useQuery<
    PlatformReceivingAccount[]
  >({
    queryKey: ['platform', 'payment-accounts'],
    queryFn: async () => unwrapApiResponse(await paymentService.listReceivingAccounts()),
  });

  const createBookingMutation = useMutation({
    mutationFn: bookingService.create,
    onSuccess: (result) => {
      if (!result.success) {
        showToast(result.error || t.submitFailed);
        return;
      }
      const created = result.data;
      setBooking({
        bookingId: created.id,
        bookingNo: created.bookingNo,
        total: created.total,
        days: created.rentalDays,
        startDate: created.startDate,
        endDate: created.endDate,
        paymentAccountId: created.payment?.account?.id,
        paymentStatus: created.payment?.status === 'approved'
          ? 'approved'
          : created.payment?.status === 'rejected'
            ? 'rejected'
            : 'pending_review',
      });
      router.push('/booking-confirmed');
    },
    onError: () => showToast(t.submitFailed),
  });

  if (!product) return <div className="[padding:60px] text-gf-muted">{bookingText.loading}</div>;

  const days = booking.days ?? 0;
  const rentalPrice = product.price * days;
  const deliveryFee = booking.delivery === 'post' ? 60 : 0;
  const deposit = product.deposit;
  const total = rentalPrice + deliveryFee + deposit;
  const selectedAccount = paymentAccounts.find(
    (account) => account.id === txnPay.paymentAccountId,
  );
  const verificationBlocked = !user.emailVerified || user.suspended;
  const canSubmit = days > 0
    && !!booking.startDate
    && !!booking.endDate
    && !!selectedAccount
    && txnPay.agree
    && !!proofFile
    && !verificationBlocked
    && !createBookingMutation.isPending;
  const deliveryLabels: Record<string, string> = {
    pickup: bookingText.pickup,
    grab: bookingText.messenger,
    post: bookingText.shipping,
  };

  function confirmPaymentEvidence() {
    if (
      !booking.productId
      || !booking.startDate
      || !booking.endDate
      || !proofFile
      || !selectedAccount
    ) return;

    createBookingMutation.mutate({
      productId: booking.productId,
      paymentAccountId: selectedAccount.id,
      startDate: booking.startDate,
      endDate: booking.endDate,
      deliveryMethod: booking.delivery,
      proofFile,
    });
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

          <div className="mb-3 text-[13px] text-gf-muted">{t.chooseReceivingAccount}</div>
          {paymentAccountsLoading && (
            <div className="py-5 text-center text-[13px] text-gf-muted">
              {t.loadingPaymentAccounts}
            </div>
          )}
          {!paymentAccountsLoading && paymentAccounts.length === 0 && (
            <div className="mb-4 rounded-[8px] border border-gf-line p-4 text-[13px] text-gf-muted">
              {t.noPaymentAccounts}
            </div>
          )}
          {paymentAccounts.map((account) => {
            const selected = selectedAccount?.id === account.id;
            const isPromptPay = account.method === 'promptpay';

            return (
              <button
                type="button"
                key={account.id}
                onClick={() => setTxnPay({
                  method: 'qr',
                  paymentAccountId: account.id,
                })}
                className={cn(
                  'mb-3.5 flex w-full cursor-pointer items-center gap-3.5 rounded-[16px] border-[1.5px] p-[18px] text-left',
                  selected
                    ? 'border-gf-brown-800 bg-gf-pink-100'
                    : 'border-gf-line bg-white',
                )}
              >
                <div className={cn(
                  'relative size-[18px] shrink-0 rounded-full border-2',
                  selected ? 'border-gf-brown-800' : 'border-gf-brown-300',
                )}>
                  {selected && <div className="absolute inset-[3px] rounded-full bg-gf-brown-800" />}
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-gf-brown-700">
                  {isPromptPay ? <QrCode size={20} /> : <Building2 size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gf-brown-900">
                    {isPromptPay ? t.promptPay : account.bank.name}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-gf-muted">
                    {account.accountName} · {account.accountNumber}
                  </div>
                </div>
              </button>
            );
          })}

          {selectedAccount && (
            <PaymentAccountDetails
              account={selectedAccount}
              total={total}
              labels={{
                promptPayQrTitle: t.promptPayQrTitle,
                promptPayQrHint: t.promptPayQrHint,
                invalidPromptPay: t.invalidPromptPay,
                accountName: t.accountName,
                accountNumber: t.accountNumber,
                amount: t.paymentAmount,
              }}
            />
          )}

          <label className="flex items-center justify-center flex-col gap-[8px] [border:2px_dashed_var(--gf-brown-300)] rounded-[16px] min-h-[118px] text-gf-muted bg-gf-pink-100 cursor-pointer text-[13px] [margin-top:12px]">
            <Upload size={24} />
            <span>{booking.paymentProofName ?? t.uploadProof}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setProofFile(file);
                setBooking({
                  paymentProofName: file?.name,
                  paymentStatus: 'not_started',
                });
              }}
              className="hidden"
            />
          </label>

          <div className="mt-5 flex items-start gap-2.5 text-[14px] leading-relaxed text-gf-brown-700">
            <input
              type="checkbox" id="tc-agree" checked={txnPay.agree}
              onChange={(e) => setTxnPay({ agree: e.target.checked })}
              className="mt-[3px]"
            />
            <div>
              <label htmlFor="tc-agree" className="cursor-pointer">
                {t.agreementPrefix}{' '}
              </label>
              <PolicyLink onClick={() => setPolicyType('rentalAgreement')}>
                {t.rentalAgreement}
              </PolicyLink>
              {` ${t.agreementAnd} `}
              <PolicyLink onClick={() => setPolicyType('paymentPolicy')}>
                {t.paymentPolicy}
              </PolicyLink>
            </div>
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
            {createBookingMutation.isPending ? t.submittingReview : t.submitReview}
          </button>
        </div>
      </div>

      <PolicyModal
        open={policyType !== null}
        policyType={policyType}
        context="payment"
        onOpenChange={(open) => {
          if (!open) setPolicyType(null);
        }}
      />
    </div>
  );
}

function PaymentAccountDetails({
  account,
  total,
  labels,
}: {
  account: PlatformReceivingAccount;
  total: number;
  labels: {
    promptPayQrTitle: string;
    promptPayQrHint: string;
    invalidPromptPay: string;
    accountName: string;
    accountNumber: string;
    amount: string;
  };
}) {
  const payload = account.method === 'promptpay'
    ? createPromptPayPayload(account.accountNumber, total)
    : null;

  if (account.method === 'promptpay') {
    return (
      <div className="mb-4 rounded-[8px] border border-gf-line bg-white p-5 text-center">
        <div className="font-semibold text-gf-brown-900">{labels.promptPayQrTitle}</div>
        {payload ? (
          <>
            <div className="mx-auto my-4 w-fit bg-white p-2">
              <QRCodeSVG value={payload} size={220} level="M" />
            </div>
            <div className="text-[17px] font-bold text-gf-brown-900">
              {money(total)} THB
            </div>
            <div className="mt-2 text-[12.5px] leading-relaxed text-gf-muted">
              {labels.promptPayQrHint}
            </div>
          </>
        ) : (
          <div className="mt-3 text-[13px] text-gf-red">{labels.invalidPromptPay}</div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-[8px] border border-gf-line bg-gf-pink-100 p-4">
      {[
        { label: labels.accountName, value: account.accountName },
        { label: labels.accountNumber, value: account.accountNumber },
        { label: labels.amount, value: `${money(total)} THB` },
      ].map((item) => (
        <div key={item.label} className="flex justify-between gap-4 py-1.5 text-[13.5px]">
          <span className="text-gf-muted">{item.label}</span>
          <span className="text-right font-semibold text-gf-brown-900">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function createPromptPayPayload(target: string, amount: number): string | null {
  try {
    return payloadFor({ recipient: target, amount });
  } catch {
    return null;
  }
}

function PolicyLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-gf-brown-800 underline underline-offset-2"
    >
      {children}
    </button>
  );
}
