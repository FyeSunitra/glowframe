import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { BookingStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import {
  adminBookingInclude,
  serializeAdminBooking,
} from '../_utils'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { id } = await context.params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Booking id is invalid.' }, { status: 400 })
    }
    const body = await request.json()
    if (body?.action !== 'cancel') {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
    }

    const existing = await prisma.booking.findUnique({
      where: { id: BigInt(id) },
      select: { status: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Booking was not found.' }, { status: 404 })
    }
    const terminalStatuses = new Set<BookingStatus>([
      BookingStatus.completed,
      BookingStatus.cancelled,
      BookingStatus.expired,
    ])
    if (terminalStatuses.has(existing.status)) {
      return NextResponse.json(
        { error: 'This booking can no longer be cancelled.' },
        { status: 409 },
      )
    }

    const booking = await prisma.booking.update({
      where: { id: BigInt(id) },
      data: {
        status: BookingStatus.cancelled,
        cancellationReason:
          typeof body.reason === 'string' && body.reason.trim()
            ? body.reason.trim()
            : 'Cancelled by admin',
      },
      include: adminBookingInclude,
    })

    const response = NextResponse.json({
      data: serializeAdminBooking(booking),
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to update admin booking', error)
    return NextResponse.json(
      { error: 'Unable to update the booking.' },
      { status: 500 },
    )
  }
}
