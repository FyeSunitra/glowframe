import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import {
  BookingStatus,
  DeliveryMethod,
  Prisma,
} from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { adminBookingInclude, serializeAdminBooking } from './_utils'

const bookingStatuses = new Set(Object.values(BookingStatus))
const deliveryMethods = new Set(Object.values(DeliveryMethod))

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
    const statusParam = request.nextUrl.searchParams.get('status')
    const deliveryParam = request.nextUrl.searchParams.get('delivery')
    const status = statusParam && bookingStatuses.has(statusParam as BookingStatus)
      ? statusParam as BookingStatus
      : undefined
    const delivery = deliveryParam && deliveryMethods.has(deliveryParam as DeliveryMethod)
      ? deliveryParam as DeliveryMethod
      : undefined

    const where: Prisma.BookingWhereInput = {
      ...(status ? { status } : {}),
      ...(delivery ? { deliveryMethod: delivery } : {}),
      ...(search
        ? {
            OR: [
              { bookingNo: { contains: search, mode: 'insensitive' } },
              { product: { title: { contains: search, mode: 'insensitive' } } },
              { renter: { displayName: { contains: search, mode: 'insensitive' } } },
              { renter: { email: { contains: search, mode: 'insensitive' } } },
              { owner: { displayName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: adminBookingInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    const response = NextResponse.json({
      data: bookings.map(serializeAdminBooking),
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
    console.error('Failed to load admin bookings', error)
    return NextResponse.json(
      { error: 'Unable to load bookings.' },
      { status: 500 },
    )
  }
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
