import { Prisma, ProductStatus } from '@/lib/generated/prisma/client'

export const adminProductInclude = {
  owner: { select: { id: true, displayName: true, email: true } },
  category: { select: { name: true } },
  brand: { select: { name: true } },
  pickupAddress: {
    select: {
      addressLine: true,
      subdistrict: true,
      district: true,
      province: true,
      postalCode: true,
    },
  },
  accessories: { include: { accessory: { select: { name: true } } } },
  customAccessories: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  media: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
  reviews: {
    where: { isHidden: false },
    select: { rating: true },
  },
  _count: { select: { bookings: true } },
} satisfies Prisma.ProductInclude

export type AdminProductRow = Prisma.ProductGetPayload<{
  include: typeof adminProductInclude
}>

export function serializeAdminProduct(product: AdminProductRow) {
  const averageRating = product.reviews.length
    ? product.reviews.reduce((total, review) => total + review.rating, 0) /
      product.reviews.length
    : 0

  return {
    id: Number(product.id),
    name: product.title,
    desc: product.description ?? '',
    price: Number(product.pricePerDay),
    deposit: Number(product.depositAmount),
    color: productColor(Number(product.id)),
    rating: Math.round(averageRating),
    bookingCount: product._count.bookings,
    status: statusForUi(product.status),
    createdAt: product.createdAt.toISOString().slice(0, 10),
    categoryName: product.category.name,
    brandName: product.brand?.name ?? product.customBrandName ?? '-',
    model: product.model,
    serialNumber: product.serialNumber,
    conditionNote: product.conditionNote,
    extraDetails: product.extraDetails,
    rejectionReason: product.rejectionReason,
    pickupAddress: [
      product.pickupAddress.addressLine,
      product.pickupAddress.subdistrict,
      product.pickupAddress.district,
      product.pickupAddress.province,
      product.pickupAddress.postalCode,
    ]
      .filter(Boolean)
      .join(', '),
    accessories: [
      ...product.accessories.map((item) => ({
        id: `master-${item.accessoryId}`,
        name: item.accessory.name,
        quantity: item.quantity,
        custom: false,
      })),
      ...product.customAccessories.map((item) => ({
        id: `custom-${item.id}`,
        name: item.name,
        quantity: item.quantity,
        custom: true,
      })),
    ],
    media: product.media.map((item) => ({
      id: Number(item.id),
      mediaType: item.mediaType,
      url: item.url,
      publicId: item.publicId,
    })),
    owner: {
      id: Number(product.owner.id),
      displayName: product.owner.displayName,
      email: product.owner.email,
    },
  }
}

function statusForUi(status: ProductStatus) {
  return status === ProductStatus.approved ? 'active' : status
}

function productColor(id: number) {
  const colors = ['#F3C9D2', '#D9E7F2', '#D7ECD9', '#F7E6A6', '#E5D9F2']
  return colors[Math.abs(id) % colors.length]
}
