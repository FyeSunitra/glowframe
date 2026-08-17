import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { BookingStatus, Prisma } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

const productSelect = {
  title: true,
  media: {
    where: { mediaType: 'image' as const },
    orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    take: 1,
    select: { url: true },
  },
}

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
    const tab = request.nextUrl.searchParams.get('tab') === 'history'
      ? 'history'
      : 'pending'
    const status = request.nextUrl.searchParams.get('status') ?? ''
    const today = utcDateStart(new Date())
    const statusWhere = returnStatusWhere(tab, status, today)
    const where: Prisma.BookingWhereInput = {
      ...statusWhere,
      ...(search
        ? {
            OR: [
              { bookingNo: { contains: search, mode: 'insensitive' } },
              { product: { title: { contains: search, mode: 'insensitive' } } },
              { renter: { displayName: { contains: search, mode: 'insensitive' } } },
              { owner: { displayName: { contains: search, mode: 'insensitive' } } },
              { rentalReturn: { returnTrackingNumber: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          bookingNo: true,
          status: true,
          endDate: true,
          updatedAt: true,
          product: { select: productSelect },
          renter: { select: { displayName: true } },
          owner: { select: { displayName: true } },
          rentalReturn: true,
        },
        orderBy: tab === 'pending'
          ? [{ endDate: 'asc' }, { updatedAt: 'desc' }]
          : { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    const response = NextResponse.json({
      data: bookings.map((booking) => ({
        id: Number(booking.id),
        bookingNo: booking.bookingNo,
        product: {
          name: booking.product.title,
          imageUrl: booking.product.media[0]?.url ?? null,
        },
        renter: booking.renter.displayName,
        owner: booking.owner.displayName,
        dueDate: booking.endDate.toISOString().slice(0, 10),
        status: displayStatus(booking, today),
        bookingStatus: booking.status,
        method: booking.rentalReturn?.returnMethod ?? null,
        providerName: booking.rentalReturn?.returnProviderName ?? null,
        trackingNumber: booking.rentalReturn?.returnTrackingNumber ?? null,
        note: booking.rentalReturn?.returnNote ?? null,
        evidenceUrl: booking.rentalReturn?.returnEvidenceUrl ?? null,
        renterReturnedAt:
          booking.rentalReturn?.renterReturnedAt?.toISOString() ?? null,
        ownerReceivedAt:
          booking.rentalReturn?.ownerReceivedAt?.toISOString() ?? null,
        damageDescription:
          booking.rentalReturn?.damageDescription ?? null,
        damageEvidenceUrl:
          booking.rentalReturn?.damageEvidenceUrl ?? null,
      })),
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
    console.error('Failed to load return operations', error)
    return NextResponse.json(
      { error: 'Unable to load return operations.' },
      { status: 500 },
    )
  }
}

function returnStatusWhere(
  tab: 'pending' | 'history',
  status: string,
  today: Date,
): Prisma.BookingWhereInput {
  if (status === 'active') {
    return { status: BookingStatus.active, endDate: { gte: today } }
  }
  if (status === 'overdue') {
    return { status: BookingStatus.active, endDate: { lt: today } }
  }
  if (status === 'awaitingOwner') {
    return { status: BookingStatus.returnPending }
  }
  if (status === 'completed') {
    return { status: BookingStatus.completed, rentalReturn: { isNot: null } }
  }
  if (status === 'damageReported' || status === 'disputed') {
    return { status: BookingStatus.disputed, rentalReturn: { isNot: null } }
  }
  return tab === 'pending'
    ? { status: { in: [BookingStatus.active, BookingStatus.returnPending] } }
    : {
        status: { in: [BookingStatus.completed, BookingStatus.disputed] },
        rentalReturn: { isNot: null },
      }
}

function displayStatus(
  booking: {
    status: BookingStatus
    endDate: Date
    rentalReturn: { damageDescription: string | null } | null
  },
  today: Date,
) {
  if (booking.status === BookingStatus.active) {
    return booking.endDate < today ? 'overdue' : 'active'
  }
  if (booking.status === BookingStatus.returnPending) return 'awaitingOwner'
  if (booking.status === BookingStatus.disputed) {
    return booking.rentalReturn?.damageDescription
      ? 'damageReported'
      : 'disputed'
  }
  return 'completed'
}

function utcDateStart(date: Date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ))
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
