import { Prisma } from '@/lib/generated/prisma/client'

export const adminBookingInclude = {
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
  renter: { select: { displayName: true, email: true } },
  owner: { select: { displayName: true, email: true } },
  payments: {
    include: {
      platformPaymentAccount: {
        include: { bank: true },
      },
    },
    orderBy: [{ attemptNo: 'desc' }, { id: 'desc' }],
    take: 1,
  },
  delivery: true,
  rentalReturn: true,
} satisfies Prisma.BookingInclude

export type AdminBookingRow = Prisma.BookingGetPayload<{
  include: typeof adminBookingInclude
}>

export function serializeAdminBooking(booking: AdminBookingRow) {
  const payment = booking.payments[0]
  return {
    id: Number(booking.id),
    bookingNo: booking.bookingNo,
    camera: {
      id: Number(booking.product.id),
      name: booking.product.title,
      color: productColor(Number(booking.productId)),
      imageUrl: booking.product.media[0]?.url ?? null,
    },
    renter: booking.renter,
    owner: booking.owner,
    days: booking.rentalDays,
    delivery: booking.deliveryMethod,
    rentalFee: Number(booking.rentalFee),
    deliveryFee: Number(booking.deliveryFee),
    deposit: Number(booking.depositSnapshot),
    total: Number(booking.totalAmount),
    startDate: booking.startDate.toISOString().slice(0, 10),
    endDate: booking.endDate.toISOString().slice(0, 10),
    status: booking.status,
    payment: payment
      ? {
          attemptNo: payment.attemptNo,
          status: payment.status,
          method: payment.platformPaymentAccount?.bank.code === 'PROMPTPAY'
            ? 'promptpay'
            : 'bank_transfer',
          proofFileName: payment.proofFileName,
          submittedAt: payment.submittedAt?.toISOString() ?? null,
          rejectionReason: payment.rejectionReason,
        }
      : null,
    pickupAddress: booking.pickupAddressSnapshot,
    recipientName: booking.recipientName,
    recipientPhone: booking.recipientPhone,
    deliveryAddress: booking.deliveryAddressSnapshot,
    deliveryNote: booking.deliveryNote,
    cancellationReason: booking.cancellationReason,
    deliveryDetails: booking.delivery
      ? {
          method: booking.delivery.method,
          providerName: booking.delivery.providerName,
          trackingNumber: booking.delivery.trackingNumber,
          shippedAt: booking.delivery.shippedAt?.toISOString() ?? null,
          readyForPickupAt:
            booking.delivery.readyForPickupAt?.toISOString() ?? null,
          renterReceivedAt:
            booking.delivery.renterReceivedAt?.toISOString() ?? null,
        }
      : null,
    returnDetails: booking.rentalReturn
      ? {
          status: booking.rentalReturn.status,
          method: booking.rentalReturn.returnMethod,
          providerName: booking.rentalReturn.returnProviderName,
          trackingNumber: booking.rentalReturn.returnTrackingNumber,
          note: booking.rentalReturn.returnNote,
          evidenceUrl: booking.rentalReturn.returnEvidenceUrl,
          renterReturnedAt:
            booking.rentalReturn.renterReturnedAt?.toISOString() ?? null,
          ownerReceivedAt:
            booking.rentalReturn.ownerReceivedAt?.toISOString() ?? null,
          damageDescription: booking.rentalReturn.damageDescription,
        }
      : null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  }
}

function productColor(id: number) {
  const colors = ['#F3C9D2', '#D9E7F2', '#D7ECD9', '#F7E6A6', '#E5D9F2']
  return colors[Math.abs(id) % colors.length]
}
