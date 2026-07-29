import { Prisma } from '@/lib/generated/prisma/client'

export const adminTransactionInclude = {
  booking: {
    select: {
      bookingNo: true,
      rentalFee: true,
      deliveryFee: true,
      depositSnapshot: true,
      totalAmount: true,
    },
  },
  payer: {
    select: {
      displayName: true,
      email: true,
    },
  },
  platformPaymentAccount: {
    include: { bank: true },
  },
} satisfies Prisma.PaymentInclude

export type AdminTransactionRow = Prisma.PaymentGetPayload<{
  include: typeof adminTransactionInclude
}>

export function serializeAdminTransaction(
  payment: AdminTransactionRow,
  platformFeeRate: number,
  proofUrl: string | null = null,
) {
  return {
    id: Number(payment.id),
    txnId: `PAY-${payment.id.toString().padStart(8, '0')}`,
    bookingNo: payment.booking.bookingNo,
    user: payment.payer,
    method: payment.platformPaymentAccount?.bank.code === 'PROMPTPAY'
      ? 'promptpay'
      : 'bank_transfer',
    rentalFee: Number(payment.booking.rentalFee),
    deliveryFee: Number(payment.booking.deliveryFee),
    deposit: Number(payment.booking.depositSnapshot),
    total: Number(payment.submittedAmount ?? payment.booking.totalAmount),
    platformFee:
      Math.round(
        Number(payment.booking.rentalFee) * platformFeeRate,
      ) / 100,
    date: (payment.submittedAt ?? payment.createdAt).toISOString(),
    status: payment.status,
    proofFileName: payment.proofFileName,
    proofUrl,
    rejectionReason: payment.rejectionReason,
    reviewedAt: payment.reviewedAt?.toISOString() ?? null,
  }
}
