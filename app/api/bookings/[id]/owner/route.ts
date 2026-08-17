import { NextRequest, NextResponse } from 'next/server'

import { setSessionCookies } from '@/lib/auth/server'
import {
  BookingStatus,
  DeliveryMethod,
  ReturnStatus,
  WalletEntryType,
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
      include: { rentalReturn: true },
    })
    if (!booking) {
      return NextResponse.json({ error: 'Booking was not found.' }, { status: 404 })
    }
    if (booking.ownerId !== auth.user.id) {
      return NextResponse.json(
        { error: 'Only the product owner can perform this action.' },
        { status: 403 },
      )
    }

    if (action === 'start_preparing') {
      requireStatus(booking.status, BookingStatus.paymentApproved)
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.preparing },
      })
    } else if (action === 'ready_for_pickup') {
      requireStatus(booking.status, BookingStatus.preparing)
      if (booking.deliveryMethod !== DeliveryMethod.pickup) {
        throw new BookingActionError(
          'Only pickup bookings can be marked ready for pickup.',
        )
      }
      await prisma.$transaction([
        prisma.delivery.upsert({
          where: { bookingId },
          create: {
            bookingId,
            method: booking.deliveryMethod,
            readyForPickupAt: new Date(),
          },
          update: { readyForPickupAt: new Date() },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.readyForPickup },
        }),
      ])
    } else if (action === 'mark_shipped') {
      requireStatus(booking.status, BookingStatus.preparing)
      if (booking.deliveryMethod === DeliveryMethod.pickup) {
        throw new BookingActionError(
          'Pickup bookings cannot be marked as shipped.',
        )
      }
      const shippingMethod = parseShippingMethod(body.shippingMethod)
      if (!shippingMethod) {
        throw new BookingActionError('Shipping method is invalid.')
      }
      const providerName = requiredText(body.providerName, 'providerName', 120)
      const trackingNumber = requiredText(
        body.trackingNumber,
        'trackingNumber',
        120,
      )
      const evidence = evidenceData(body, id, 'delivery')
      const note = optionalText(body.note)
      await prisma.$transaction([
        prisma.delivery.upsert({
          where: { bookingId },
          create: {
            bookingId,
            method: shippingMethod,
            providerName,
            trackingNumber,
            shippedAt: new Date(),
            evidenceUrl: evidence.url,
            evidencePublicId: evidence.publicId,
            note,
          },
          update: {
            method: shippingMethod,
            providerName,
            trackingNumber,
            shippedAt: new Date(),
            evidenceUrl: evidence.url,
            evidencePublicId: evidence.publicId,
            note,
          },
        }),
        prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.shipped },
        }),
      ])
    } else if (action === 'confirm_return') {
      requireStatus(booking.status, BookingStatus.returnPending)
      if (
        !booking.rentalReturn ||
        booking.rentalReturn.status !== ReturnStatus.renterReturned
      ) {
        throw new BookingActionError(
          'The renter has not confirmed the item return.',
        )
      }
      await completeBooking(bookingId, booking)
    } else if (action === 'report_damage') {
      requireStatus(booking.status, BookingStatus.returnPending)
      if (
        !booking.rentalReturn ||
        booking.rentalReturn.status !== ReturnStatus.renterReturned
      ) {
        throw new BookingActionError(
          'The renter has not confirmed the item return.',
        )
      }
      const description = requiredText(
        body.description,
        'description',
        2000,
      )
      const evidence = evidenceData(body, id, 'damage')
      const damageAmount = Number(body.damageAmount ?? 0)
      if (
        !Number.isFinite(damageAmount) ||
        damageAmount < 0 ||
        damageAmount > Number(booking.depositSnapshot)
      ) {
        throw new BookingActionError('Damage amount is invalid.')
      }
      await prisma.$transaction(async (transaction) => {
        const claimed = await transaction.booking.updateMany({
          where: {
            id: bookingId,
            status: BookingStatus.returnPending,
          },
          data: { status: BookingStatus.disputed },
        })
        if (claimed.count !== 1) {
          throw new BookingActionError(
            'This return has already been reviewed.',
          )
        }
        await transaction.rentalReturn.update({
          where: { bookingId },
          data: {
            status: ReturnStatus.damageReported,
            ownerReceivedAt: new Date(),
            damageDescription: description,
            damageEvidenceUrl: evidence.url,
            damageEvidencePublicId: evidence.publicId,
            damageAmount,
          },
        })
      })
    } else {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
    }

    const updated = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: renterBookingInclude,
    })
    const response = NextResponse.json({
      data: serializeRenterBooking(updated, 'owner'),
    })
    if (auth.refreshedSession) {
      setSessionCookies(response, auth.refreshedSession)
    }
    return response
  } catch (error) {
    if (error instanceof BookingActionError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Failed to process owner booking action', error)
    return NextResponse.json(
      { error: 'Unable to update the rental.' },
      { status: 500 },
    )
  }
}

async function completeBooking(
  bookingId: bigint,
  booking: {
    ownerId: bigint
    renterId: bigint
    ownerReceivableAmount: { toString(): string }
    depositSnapshot: { toString(): string }
  },
) {
  await prisma.$transaction(async (transaction) => {
    const claimed = await transaction.booking.updateMany({
      where: {
        id: bookingId,
        status: BookingStatus.returnPending,
      },
      data: {
        status: BookingStatus.completed,
        completedAt: new Date(),
      },
    })
    if (claimed.count !== 1) {
      throw new BookingActionError(
        'This return has already been reviewed.',
      )
    }
    const [ownerWallet, renterWallet] = await Promise.all([
      transaction.wallet.upsert({
        where: { userId: booking.ownerId },
        create: { userId: booking.ownerId },
        update: {},
      }),
      transaction.wallet.upsert({
        where: { userId: booking.renterId },
        create: { userId: booking.renterId },
        update: {},
      }),
    ])
    await transaction.rentalReturn.update({
      where: { bookingId },
      data: {
        status: ReturnStatus.completed,
        ownerReceivedAt: new Date(),
      },
    })
    await transaction.wallet.update({
      where: { id: ownerWallet.id },
      data: { simulatedBalance: { increment: booking.ownerReceivableAmount.toString() } },
    })
    await transaction.wallet.update({
      where: { id: renterWallet.id },
      data: {
        simulatedBalance: { increment: booking.depositSnapshot.toString() },
      },
    })
    await transaction.walletEntry.createMany({
      data: [
        {
          walletId: ownerWallet.id,
          bookingId,
          entryType: WalletEntryType.rentalIncome,
          amount: booking.ownerReceivableAmount.toString(),
          description: 'Owner receivable after platform fee and delivery allocation',
        },
        {
          walletId: renterWallet.id,
          bookingId,
          entryType: WalletEntryType.depositReturn,
          amount: booking.depositSnapshot.toString(),
          description: 'Security deposit returned after completed rental',
        },
      ],
    })
  })
}

function requireStatus(current: BookingStatus, expected: BookingStatus) {
  if (current !== expected) {
    throw new BookingActionError(
      `This action requires booking status ${expected}.`,
    )
  }
}

function requiredText(value: unknown, field: string, max: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new BookingActionError(`${field} is invalid.`)
  }
  return value.trim()
}

function optionalText(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseShippingMethod(value: unknown): DeliveryMethod | null {
  if (
    value === DeliveryMethod.messenger ||
    value === DeliveryMethod.shipping
  ) {
    return value
  }
  return null
}

function evidenceData(
  body: Record<string, unknown>,
  bookingId: string,
  kind: 'delivery' | 'damage',
) {
  const url = typeof body.evidenceUrl === 'string' ? body.evidenceUrl : ''
  const publicId =
    typeof body.evidencePublicId === 'string' ? body.evidencePublicId : ''
  const prefix = `glowframe/bookings/${bookingId}/${kind}/`
  if (
    !url.startsWith('https://res.cloudinary.com/') ||
    !publicId.startsWith(prefix)
  ) {
    throw new BookingActionError('Evidence image is invalid.')
  }
  return { url, publicId }
}

class BookingActionError extends Error {}
