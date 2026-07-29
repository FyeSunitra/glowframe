import { Prisma } from '@/lib/generated/prisma/client'

export const renterBookingInclude = {
  product: {
    select: {
      id: true,
      title: true,
      media: {
        where: { mediaType: 'image' },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
    },
  },
  owner: {
    select: {
      displayName: true,
      phone: true,
    },
  },
  renter: {
    select: {
      displayName: true,
      phone: true,
    },
  },
  payments: {
    include: {
      platformPaymentAccount: {
        include: { bank: true },
      },
    },
    orderBy: [{ attemptNo: 'desc' }, { id: 'desc' }],
  },
  delivery: true,
  rentalReturn: true,
} satisfies Prisma.BookingInclude

export type RenterBookingRow = Prisma.BookingGetPayload<{
  include: typeof renterBookingInclude
}>

export function serializeRenterBooking(
  booking: RenterBookingRow,
  viewerRole: 'renter' | 'owner' = 'renter',
) {
  const payment = booking.payments[0]
  const paymentAccount = payment?.platformPaymentAccount
  const ownerContactVisible = [
    'paymentApproved',
    'preparing',
    'readyForPickup',
    'shipped',
    'active',
    'returnPending',
    'completed',
    'deliveryIssue',
    'disputed',
  ].includes(booking.status)

  return {
    id: Number(booking.id),
    bookingNo: booking.bookingNo,
    status: booking.status,
    viewerRole,
    product: {
      id: Number(booking.product.id),
      name: booking.product.title,
      imageUrl: booking.product.media[0]?.url ?? null,
    },
    owner: {
      displayName: booking.owner.displayName,
      phone: ownerContactVisible ? booking.owner.phone : null,
    },
    renter: {
      displayName: booking.renter.displayName,
      phone: ownerContactVisible ? booking.renter.phone : null,
    },
    startDate: dateKey(booking.startDate),
    endDate: dateKey(booking.endDate),
    rentalDays: booking.rentalDays,
    deliveryMethod: booking.deliveryMethod,
    rentalFee: Number(booking.rentalFee),
    deliveryFee: Number(booking.deliveryFee),
    deposit: Number(booking.depositSnapshot),
    total: Number(booking.totalAmount),
    payment: payment
      ? {
          id: Number(payment.id),
          attemptNo: payment.attemptNo,
          status: payment.status,
          proofFileName: payment.proofFileName,
          submittedAt: payment.submittedAt?.toISOString() ?? null,
          rejectionReason: payment.rejectionReason,
          account: paymentAccount
            ? {
                id: Number(paymentAccount.id),
                method: paymentAccount.bank.code === 'PROMPTPAY'
                  ? 'promptpay'
                  : 'bank_transfer',
                bankName: paymentAccount.bank.name,
                bankAbbreviation: paymentAccount.bank.abbreviation,
                accountName: paymentAccount.accountName,
                accountNumber: paymentAccount.accountNumber,
              }
            : null,
        }
      : null,
    delivery: booking.delivery
      ? {
          method: booking.delivery.method,
          providerName: booking.delivery.providerName,
          trackingNumber: booking.delivery.trackingNumber,
          shippedAt: booking.delivery.shippedAt?.toISOString() ?? null,
          readyForPickupAt: booking.delivery.readyForPickupAt?.toISOString() ?? null,
          renterReceivedAt: booking.delivery.renterReceivedAt?.toISOString() ?? null,
          evidenceUrl: booking.delivery.evidenceUrl,
          note: booking.delivery.note,
        }
      : null,
    return: booking.rentalReturn
      ? {
          status: booking.rentalReturn.status,
          method: booking.rentalReturn.returnMethod,
          providerName: booking.rentalReturn.returnProviderName,
          trackingNumber: booking.rentalReturn.returnTrackingNumber,
          note: booking.rentalReturn.returnNote,
          evidenceUrl: booking.rentalReturn.returnEvidenceUrl,
          renterReturnedAt: booking.rentalReturn.renterReturnedAt?.toISOString() ?? null,
          ownerReceivedAt: booking.rentalReturn.ownerReceivedAt?.toISOString() ?? null,
          damageDescription: booking.rentalReturn.damageDescription,
          damageEvidenceUrl: booking.rentalReturn.damageEvidenceUrl,
          damageAmount: Number(booking.rentalReturn.damageAmount),
          approvedDamageAmount:
            booking.rentalReturn.approvedDamageAmount === null
              ? null
              : Number(booking.rentalReturn.approvedDamageAmount),
          adminDecision: parseDamageDecision(
            booking.rentalReturn.adminDecision,
          ),
          adminDecisionNote: booking.rentalReturn.adminDecisionNote,
        }
      : null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  }
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDamageDecision(value: string | null) {
  return value === 'no_damage' ||
    value === 'partial_damage' ||
    value === 'full_damage'
    ? value
    : null
}
