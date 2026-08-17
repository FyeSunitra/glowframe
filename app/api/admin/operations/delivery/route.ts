import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { DeliveryMethod, Prisma } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

const methods = new Set(Object.values(DeliveryMethod))

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const page = positiveInteger(request.nextUrl.searchParams.get('page'), 1)
    const limit = Math.min(
      positiveInteger(request.nextUrl.searchParams.get('limit'), 10),
      50,
    )
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const tab = request.nextUrl.searchParams.get('tab') === 'delivered'
      ? 'delivered'
      : 'active'
    const direction = request.nextUrl.searchParams.get('direction')
    const methodParam = request.nextUrl.searchParams.get('method')
    const method = methodParam && methods.has(methodParam as DeliveryMethod)
      ? methodParam as DeliveryMethod
      : undefined
    const bookingSearch: Prisma.BookingWhereInput = search
      ? {
          OR: [
            { bookingNo: { contains: search, mode: 'insensitive' } },
            { product: { title: { contains: search, mode: 'insensitive' } } },
            { renter: { displayName: { contains: search, mode: 'insensitive' } } },
            { owner: { displayName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}

    const [outbound, returns] = await Promise.all([
      direction === 'return'
        ? []
        : prisma.delivery.findMany({
            where: {
              ...(method ? { method } : {}),
              ...(tab === 'delivered'
                ? { renterReceivedAt: { not: null } }
                : {
                    renterReceivedAt: null,
                    OR: [
                      { shippedAt: { not: null } },
                      { readyForPickupAt: { not: null } },
                    ],
                  }),
              booking: bookingSearch,
            },
            include: { booking: { include: operationBookingInclude } },
          }),
      direction === 'outbound'
        ? []
        : prisma.rentalReturn.findMany({
            where: {
              renterReturnedAt: { not: null },
              ...(method ? { returnMethod: method } : {}),
              ...(tab === 'delivered'
                ? { ownerReceivedAt: { not: null } }
                : { ownerReceivedAt: null }),
              booking: bookingSearch,
            },
            include: { booking: { include: operationBookingInclude } },
          }),
    ])

    const items = [
      ...outbound.map(serializeOutbound),
      ...returns.map(serializeReturn),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const total = items.length
    const paged = items.slice((page - 1) * limit, page * limit)

    const response = NextResponse.json({
      data: paged,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load delivery operations', error)
    return NextResponse.json(
      { error: 'Unable to load delivery operations.' },
      { status: 500 },
    )
  }
}

const operationBookingInclude = {
  product: {
    select: {
      title: true,
      media: {
        where: { mediaType: 'image' as const },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
        take: 1,
        select: { url: true },
      },
    },
  },
  renter: { select: { displayName: true } },
  owner: { select: { displayName: true } },
}

type OutboundRow = Prisma.DeliveryGetPayload<{
  include: { booking: { include: typeof operationBookingInclude } }
}>
type ReturnRow = Prisma.RentalReturnGetPayload<{
  include: { booking: { include: typeof operationBookingInclude } }
}>

function baseBooking(booking: OutboundRow['booking']) {
  return {
    bookingId: Number(booking.id),
    bookingNo: booking.bookingNo,
    product: {
      name: booking.product.title,
      imageUrl: booking.product.media[0]?.url ?? null,
    },
    renter: booking.renter.displayName,
    owner: booking.owner.displayName,
  }
}

function serializeOutbound(item: OutboundRow) {
  const timeline = [
    item.readyForPickupAt
      ? { event: 'readyForPickup' as const, at: item.readyForPickupAt.toISOString() }
      : null,
    item.shippedAt
      ? { event: 'shipped' as const, at: item.shippedAt.toISOString() }
      : null,
    item.renterReceivedAt
      ? { event: 'renterReceived' as const, at: item.renterReceivedAt.toISOString() }
      : null,
  ].filter((event): event is NonNullable<typeof event> => Boolean(event))
  return {
    id: `outbound-${item.id}`,
    ...baseBooking(item.booking),
    direction: 'outbound' as const,
    method: item.method,
    providerName: item.providerName,
    trackingNumber: item.trackingNumber,
    note: item.note,
    evidenceUrl: item.evidenceUrl,
    address:
      item.booking.deliveryAddressSnapshot ??
      item.booking.pickupAddressSnapshot,
    status: item.renterReceivedAt
      ? 'received' as const
      : item.readyForPickupAt
        ? 'readyForPickup' as const
        : 'shipped' as const,
    updatedAt: item.updatedAt.toISOString(),
    timeline,
  }
}

function serializeReturn(item: ReturnRow) {
  const timeline = [
    item.renterReturnedAt
      ? { event: 'renterReturned' as const, at: item.renterReturnedAt.toISOString() }
      : null,
    item.ownerReceivedAt
      ? { event: 'ownerReceived' as const, at: item.ownerReceivedAt.toISOString() }
      : null,
  ].filter((event): event is NonNullable<typeof event> => Boolean(event))
  return {
    id: `return-${item.id}`,
    ...baseBooking(item.booking),
    direction: 'return' as const,
    method: item.returnMethod ?? item.booking.deliveryMethod,
    providerName: item.returnProviderName,
    trackingNumber: item.returnTrackingNumber,
    note: item.returnNote,
    evidenceUrl: item.returnEvidenceUrl,
    address: item.booking.pickupAddressSnapshot,
    status: item.ownerReceivedAt
      ? 'returnReceived' as const
      : 'returnShipped' as const,
    updatedAt: item.updatedAt.toISOString(),
    timeline,
  }
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
