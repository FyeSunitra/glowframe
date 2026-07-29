import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { BookingStatus, Prisma, ReturnStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { adminDisputeInclude, serializeAdminDispute } from './_utils'

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
    const status =
      request.nextUrl.searchParams.get('status') === 'resolved'
        ? 'resolved'
        : 'pending'

    const where: Prisma.RentalReturnWhereInput = {
      damageDescription: { not: null },
      ...(status === 'resolved'
        ? { reviewedAt: { not: null } }
        : {
            reviewedAt: null,
            status: ReturnStatus.damageReported,
            booking: { status: BookingStatus.disputed },
          }),
      ...(search
        ? {
            OR: [
              { booking: { bookingNo: { contains: search, mode: 'insensitive' } } },
              { booking: { product: { title: { contains: search, mode: 'insensitive' } } } },
              { booking: { renter: { displayName: { contains: search, mode: 'insensitive' } } } },
              { booking: { owner: { displayName: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.rentalReturn.findMany({
        where,
        include: adminDisputeInclude,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rentalReturn.count({ where }),
    ])

    const response = NextResponse.json({
      data: items.map(serializeAdminDispute),
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
    console.error('Failed to load admin damage claims', error)
    return NextResponse.json(
      { error: 'Unable to load damage claims.' },
      { status: 500 },
    )
  }
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
