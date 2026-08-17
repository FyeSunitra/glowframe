import { Prisma, ProductStatus, VerificationStatus } from '@/lib/generated/prisma/client'

export const adminUserInclude = {
  identityVerifications: {
    where: {
      status: VerificationStatus.approved,
      reviewedBy: { not: null },
    },
    select: { id: true },
    take: 1,
  },
  ownedProducts: {
    where: { status: ProductStatus.approved },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      pricePerDay: true,
      media: {
        where: { mediaType: 'image' },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        take: 1,
        select: { url: true },
      },
    },
  },
  rentedBookings: {
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      bookingNo: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      product: { select: { title: true } },
    },
  },
  _count: {
    select: {
      ownedProducts: true,
      rentedBookings: true,
    },
  },
} satisfies Prisma.UserInclude

export type AdminUserRow = Prisma.UserGetPayload<{
  include: typeof adminUserInclude
}>

export function serializeAdminUser(user: AdminUserRow) {
  return {
    id: Number(user.id),
    displayName: user.displayName,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    phoneVerified: Boolean(user.phone),
    emailVerified: Boolean(user.emailVerifiedAt),
    idVerified: user.identityVerifications.length > 0,
    listings: user._count.ownedProducts,
    bookings: user._count.rentedBookings,
    joinedAt: user.createdAt.toISOString(),
    status: user.status,
    activeListings: user.ownedProducts.map((product) => ({
      id: Number(product.id),
      name: product.title,
      imageUrl: product.media[0]?.url ?? null,
      pricePerDay: Number(product.pricePerDay),
    })),
    recentBookings: user.rentedBookings.map((booking) => ({
      id: Number(booking.id),
      bookingNo: booking.bookingNo,
      productName: booking.product.title,
      total: Number(booking.totalAmount),
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    })),
  }
}
