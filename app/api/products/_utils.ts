import { BookingStatus, Prisma, VerificationStatus } from '@/lib/generated/prisma/client'

export const publicProductInclude = {
  category: true,
  brand: true,
  pickupAddress: true,
  media: {
    orderBy: { sortOrder: 'asc' },
  },
  accessories: {
    include: { accessory: true },
  },
  customAccessories: {
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
  },
  owner: {
    select: {
      displayName: true,
      identityVerifications: {
        where: {
          status: VerificationStatus.approved,
          reviewedBy: { not: null },
        },
        select: { id: true },
        take: 1,
      },
    },
  },
  reviews: {
    where: { isHidden: false },
    select: { rating: true },
  },
  bookings: {
    where: {
      status: {
        notIn: [BookingStatus.cancelled, BookingStatus.expired],
      },
    },
    select: {
      startDate: true,
      endDate: true,
    },
  },
} satisfies Prisma.ProductInclude

export type PublicProductRow = Prisma.ProductGetPayload<{
  include: typeof publicProductInclude
}>

export function serializeProduct(product: PublicProductRow) {
  const rating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
        product.reviews.length
      : 5

  return {
    id: Number(product.id),
    name: product.title,
    desc: product.description ?? '',
    price: Number(product.pricePerDay),
    deposit: Number(product.depositAmount),
    color: productColor(Number(product.id)),
    rating,
    category: {
      id: Number(product.category.id),
      name: product.category.name,
    },
    brand: product.brand
      ? {
          id: Number(product.brand.id),
          name: product.brand.name,
        }
      : product.customBrandName
        ? { name: product.customBrandName }
        : undefined,
    model: product.model,
    conditionNote: product.conditionNote ?? undefined,
    extraDetails: product.extraDetails ?? undefined,
    accessories: [
      ...product.accessories.map((item) => ({
        id: `master-${item.accessoryId}`,
        name: item.accessory.name,
        quantity: item.quantity,
      })),
      ...product.customAccessories.map((item) => ({
        id: `custom-${item.id}`,
        name: item.name,
        quantity: item.quantity,
      })),
    ],
    media: product.media.map((item) => ({
      id: Number(item.id),
      mediaType: item.mediaType,
      url: item.url,
      publicId: item.publicId ?? undefined,
      sortOrder: item.sortOrder,
    })),
    owner: {
      displayName: product.owner.displayName,
      rating: 5,
      verified: product.owner.identityVerifications.length > 0,
    },
    pickupArea: {
      district: product.pickupAddress.district ?? product.pickupAddress.subdistrict ?? '',
      province: product.pickupAddress.province,
    },
    status: product.status,
    unavailableDates: bookingDates(product.bookings),
  }
}

export function serializeOwnerProduct(product: PublicProductRow) {
  return {
    ...serializeProduct(product),
    serialNumber: product.serialNumber ?? undefined,
    rejectionReason: product.rejectionReason ?? undefined,
    pickupAddressId: Number(product.pickupAddressId),
    customBrandName: product.customBrandName ?? undefined,
    masterAccessories: product.accessories.map((item) => ({
      accessoryId: Number(item.accessoryId),
      quantity: item.quantity,
    })),
    customAccessories: product.customAccessories.map((item) => ({
      name: item.name,
      quantity: item.quantity,
    })),
  }
}

function bookingDates(bookings: Array<{ startDate: Date; endDate: Date }>) {
  const dates = new Set<string>()

  for (const booking of bookings) {
    const current = new Date(booking.startDate)
    const end = new Date(booking.endDate)

    while (current <= end) {
      dates.add(current.toISOString().slice(0, 10))
      current.setUTCDate(current.getUTCDate() + 1)
    }
  }

  return [...dates].sort()
}

function productColor(id: number) {
  const colors = ['#F3C9D2', '#D9E7F2', '#D7ECD9', '#F7E6A6', '#E5D9F2']
  return colors[Math.abs(id) % colors.length]
}
