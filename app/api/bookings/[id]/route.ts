import { NextRequest, NextResponse } from 'next/server'
import { setSessionCookies } from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'
import { getBookingRequestContext } from '../_auth'
import { renterBookingInclude, serializeRenterBooking } from '../_utils'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getBookingRequestContext()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const { id } = await context.params
    const bookingId = Number(id)
    if (!Number.isSafeInteger(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: 'Booking id is invalid.' }, { status: 400 })
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: BigInt(bookingId),
        OR: [
          { renterId: auth.user.id },
          { ownerId: auth.user.id },
        ],
      },
      include: renterBookingInclude,
    })
    if (!booking) {
      return NextResponse.json({ error: 'Booking was not found.' }, { status: 404 })
    }

    const response = NextResponse.json({
      data: serializeRenterBooking(
        booking,
        booking.ownerId === auth.user.id ? 'owner' : 'renter',
      ),
    })
    if (auth.refreshedSession) {
      setSessionCookies(response, auth.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load renter booking', error)
    return NextResponse.json(
      { error: 'Unable to load rental details.' },
      { status: 500 },
    )
  }
}
