import { Prisma } from '@/lib/generated/prisma/client'

export const adminDisputeInclude = {
  reviewer: { select: { displayName: true } },
  booking: {
    include: {
      renter: { select: { displayName: true, email: true } },
      owner: { select: { displayName: true, email: true } },
      delivery: {
        select: { evidenceUrl: true },
      },
      product: {
        select: {
          title: true,
          media: {
            where: { mediaType: 'image' },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            take: 1,
            select: { url: true },
          },
        },
      },
    },
  },
} satisfies Prisma.RentalReturnInclude

export type AdminDisputeRow = Prisma.RentalReturnGetPayload<{
  include: typeof adminDisputeInclude
}>

export function serializeAdminDispute(item: AdminDisputeRow) {
  return {
    id: Number(item.id),
    bookingId: Number(item.bookingId),
    bookingNo: item.booking.bookingNo,
    status: item.reviewedAt ? 'resolved' as const : 'pending' as const,
    product: {
      name: item.booking.product.title,
      imageUrl: item.booking.product.media[0]?.url ?? null,
    },
    renter: item.booking.renter,
    owner: item.booking.owner,
    rentalFee: Number(item.booking.rentalFee),
    deposit: Number(item.booking.depositSnapshot),
    claimedAmount: Number(item.damageAmount),
    approvedAmount:
      item.approvedDamageAmount === null
        ? null
        : Number(item.approvedDamageAmount),
    damageDescription: item.damageDescription ?? '',
    damageEvidenceUrl: item.damageEvidenceUrl ?? '',
    deliveryEvidenceUrl: item.booking.delivery?.evidenceUrl ?? null,
    returnEvidenceUrl: item.returnEvidenceUrl,
    renterReason: item.renterDisputeReason,
    decision: parseDecision(item.adminDecision),
    decisionNote: item.adminDecisionNote,
    reviewedBy: item.reviewer?.displayName ?? null,
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    createdAt: item.updatedAt.toISOString(),
  }
}

function parseDecision(value: string | null) {
  return value === 'no_damage' ||
    value === 'partial_damage' ||
    value === 'full_damage'
    ? value
    : null
}
