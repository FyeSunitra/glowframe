import { NextRequest, NextResponse } from 'next/server'

import { setSessionCookies } from '@/lib/auth/server'
import {
  BookingStatus,
  DeliveryMethod,
  ReturnStatus,
} from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { getBookingRequestContext } from '../../_auth'
import {
  renterBookingInclude,
  serializeRenterBooking,
} from '../../_utils'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getBookingRequestContext()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }
    const { id } = await context.params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Booking id is invalid.' }, { status: 400 })
    }
    const bookingId = BigInt(id)
    const body = await request.json()
    const action = typeof body?.action === 'string' ? body.action : ''
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true, deliveryMethod: true, renterId: true },
    })
    if (!booking) {
      return NextResponse.json({ error: 'Booking was not found.' }, { status: 404 })
    }
    if (booking.renterId !== auth.user.id) {
      return NextResponse.json(
        { error: 'Only the renter can perform this action.' },
        { status: 403 },
      )
    }

    if (action === 'confirm_received') {
      if (
        booking.status !== BookingStatus.readyForPickup &&
        booking.status !== BookingStatus.shipped
      ) {
        throw new BookingActionError(
          'This booking is not ready for receipt confirmation.',
        )
      }
      await prisma.$transaction([
        prisma.delivery.upsert({
          where: { bookingId },
          create: {
            bookingId,
            method: booking.deliveryMethod,
            renterReceivedAt: new Date(),
          },
          update: { renterReceivedAt: new Date() },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.active,
            confirmedAt: new Date(),
          },
        }),
      ])
    } else if (action === 'request_return') {
      if (booking.status !== BookingStatus.active) {
        throw new BookingActionError(
          'Only active rentals can be returned.',
        )
      }
      const returnMethod = parseDeliveryMethod(body.returnMethod)
      if (!returnMethod) {
        throw new BookingActionError('Return method is invalid.')
      }
      const providerName = optionalText(body.providerName, 120)
      const trackingNumber = optionalText(body.trackingNumber, 120)
      if (
        returnMethod !== DeliveryMethod.pickup &&
        (!providerName || !trackingNumber)
      ) {
        throw new BookingActionError(
          'Provider and tracking number are required for delivery returns.',
        )
      }
      const note = optionalText(body.note, 2000)
      const evidence = evidenceData(body, id)
      await prisma.$transaction([
        prisma.rentalReturn.upsert({
          where: { bookingId },
          create: {
            bookingId,
            status: ReturnStatus.renterReturned,
            returnMethod,
            returnProviderName: providerName,
            returnTrackingNumber: trackingNumber,
            returnNote: note,
            returnEvidenceUrl: evidence.url,
            returnEvidencePublicId: evidence.publicId,
            renterReturnedAt: new Date(),
          },
          update: {
            status: ReturnStatus.renterReturned,
            returnMethod,
            returnProviderName: providerName,
            returnTrackingNumber: trackingNumber,
            returnNote: note,
            returnEvidenceUrl: evidence.url,
            returnEvidencePublicId: evidence.publicId,
            renterReturnedAt: new Date(),
          },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.returnPending },
        }),
      ])
    } else {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
    }

    const updated = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: renterBookingInclude,
    })
    const response = NextResponse.json({
      data: serializeRenterBooking(updated, 'renter'),
    })
    if (auth.refreshedSession) {
      setSessionCookies(response, auth.refreshedSession)
    }
    return response
  } catch (error) {
    if (error instanceof BookingActionError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Failed to process renter booking action', error)
    return NextResponse.json(
      { error: 'Unable to update the rental.' },
      { status: 500 },
    )
  }
}

class BookingActionError extends Error {}

function parseDeliveryMethod(value: unknown): DeliveryMethod | null {
  if (
    value === DeliveryMethod.pickup ||
    value === DeliveryMethod.messenger ||
    value === DeliveryMethod.shipping
  ) {
    return value
  }
  return null
}

function optionalText(value: unknown, max: number) {
  if (typeof value !== 'string' || !value.trim()) return null
  const text = value.trim()
  if (text.length > max) {
    throw new BookingActionError('Return information is too long.')
  }
  return text
}

function evidenceData(body: Record<string, unknown>, bookingId: string) {
  const url = typeof body.evidenceUrl === 'string' ? body.evidenceUrl : ''
  const publicId =
    typeof body.evidencePublicId === 'string' ? body.evidencePublicId : ''
  const prefix = `glowframe/bookings/${bookingId}/return/`
  if (
    !url.startsWith('https://res.cloudinary.com/') ||
    !publicId.startsWith(prefix)
  ) {
    throw new BookingActionError('Return evidence image is invalid.')
  }
  return { url, publicId }
}
