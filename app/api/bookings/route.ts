import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import {
  BookingStatus,
  DeliveryMethod,
  PaymentStatus,
  ProductStatus,
  Prisma,
} from '@/lib/generated/prisma/client'
import {
  createSupabaseAuthClient,
  setSessionCookies,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'
import { getBookingRequestContext } from './_auth'
import { renterBookingInclude, serializeRenterBooking } from './_utils'

const unavailableStatuses = [
  BookingStatus.cancelled,
  BookingStatus.expired,
]
const MAX_PROOF_SIZE = 5 * 1024 * 1024
const PROOF_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

export async function GET(request: NextRequest) {
  try {
    const context = await getBookingRequestContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const page = positiveInteger(request.nextUrl.searchParams.get('page'), 1)
    const limit = Math.min(
      positiveInteger(request.nextUrl.searchParams.get('limit'), 10),
      50,
    )
    const skip = (page - 1) * limit
    const filter = request.nextUrl.searchParams.get('filter')
    const role = request.nextUrl.searchParams.get('role') === 'owner'
      ? 'owner'
      : 'renter'
    const where = {
      ...(role === 'owner'
        ? { ownerId: context.user.id }
        : { renterId: context.user.id }),
      ...bookingFilter(filter),
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: renterBookingInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    const response = NextResponse.json({
      data: bookings.map((booking) => serializeRenterBooking(booking, role)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
    if (context.refreshedSession) {
      setSessionCookies(response, context.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load renter bookings', error)
    return NextResponse.json(
      { error: 'Unable to load your rentals.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getBookingRequestContext()
    if (!context) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }
    if (!context.user.emailVerifiedAt) {
      return NextResponse.json(
        { error: 'Email verification is required.' },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const body = Object.fromEntries(formData.entries()) as Record<string, unknown>
    const proof = formData.get('proof')
    if (!(proof instanceof File)) {
      return NextResponse.json(
        { error: 'A payment proof image is required.' },
        { status: 400 },
      )
    }
    const proofExtension = PROOF_TYPES.get(proof.type)
    if (!proofExtension) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, and WEBP payment proofs are supported.' },
        { status: 400 },
      )
    }
    if (proof.size === 0 || proof.size > MAX_PROOF_SIZE) {
      return NextResponse.json(
        { error: 'The payment proof must be no larger than 5 MB.' },
        { status: 400 },
      )
    }
    const productId = positiveBigInt(body.productId, 'productId')
    const paymentAccountId = positiveBigInt(
      body.paymentAccountId,
      'paymentAccountId',
    )
    const startDate = parseDate(body.startDate, 'startDate')
    const endDate = parseDate(body.endDate, 'endDate')
    const deliveryMethod = parseDeliveryMethod(body.deliveryMethod)
    const proofFileName = requiredString(proof.name, 'proofFileName')
    if (proofFileName.length > 255) {
      return NextResponse.json(
        { error: 'Payment proof file name is too long.' },
        { status: 400 },
      )
    }

    const settings = await prisma.platformSetting.findUnique({
      where: { id: 1 },
      select: { minAdvanceDays: true, platformFee: true },
    })
    const minimumStart = startOfUtcDay(new Date())
    minimumStart.setUTCDate(
      minimumStart.getUTCDate() + (settings?.minAdvanceDays ?? 5),
    )
    if (startDate < minimumStart) {
      return NextResponse.json(
        { error: `Bookings must start at least ${settings?.minAdvanceDays ?? 5} days ahead.` },
        { status: 409 },
      )
    }
    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be on or after start date.' },
        { status: 400 },
      )
    }

    if (!context.accessToken || !context.refreshToken) {
      return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 })
    }
    const supabase = createSupabaseAuthClient()
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: context.accessToken,
      refresh_token: context.refreshToken,
    })
    if (sessionError) {
      return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 })
    }
    const proofBucket =
      process.env.SUPABASE_PAYMENT_BUCKET ??
      process.env.SUPABASE_IDENTITY_BUCKET ??
      'identity-documents'
    const proofStoragePath =
      `${context.authUserId}/payments/${randomUUID()}.${proofExtension}`
    const { error: uploadError } = await supabase.storage
      .from(proofBucket)
      .upload(proofStoragePath, await proof.arrayBuffer(), {
        contentType: proof.type,
        upsert: false,
      })
    if (uploadError) {
      console.error('Failed to upload payment proof', uploadError)
      return NextResponse.json(
        { error: 'Private payment storage is not configured or the upload was denied.' },
        { status: 502 },
      )
    }

    let booking
    try {
      booking = await prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findFirst({
        where: {
          id: productId,
          status: ProductStatus.approved,
        },
        include: { pickupAddress: true },
      })
      if (!product) throw new BookingRequestError('Product is unavailable.', 404)
      if (product.ownerId === context.user.id) {
        throw new BookingRequestError('You cannot rent your own product.', 409)
      }

      const paymentAccount = await transaction.platformPaymentAccount.findFirst({
        where: {
          id: paymentAccountId,
          isActive: true,
          bank: { isActive: true },
        },
      })
      if (!paymentAccount) {
        throw new BookingRequestError('Payment account is unavailable.', 409)
      }

      const overlap = await transaction.booking.findFirst({
        where: {
          productId,
          status: { notIn: unavailableStatuses },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
        select: { id: true },
      })
      if (overlap) {
        throw new BookingRequestError(
          'The selected rental dates are no longer available.',
          409,
        )
      }

      const rentalDays = inclusiveDays(startDate, endDate)
      const rentalFee = product.pricePerDay.mul(rentalDays)
      const deliveryFee = new Prisma.Decimal(
        deliveryMethod === DeliveryMethod.shipping ? 60 : 0,
      )
      const totalAmount = rentalFee
        .add(product.depositAmount)
        .add(deliveryFee)
      const platformFeeRate = settings?.platformFee ?? new Prisma.Decimal(10)
      const platformFeeAmount = rentalFee
        .mul(platformFeeRate)
        .div(100)
        .toDecimalPlaces(2)
      const ownerReceivableAmount = rentalFee
        .sub(platformFeeAmount)
        .add(deliveryFee)

      return transaction.booking.create({
        data: {
          bookingNo: createBookingNo(),
          productId,
          renterId: context.user.id,
          ownerId: product.ownerId,
          status: BookingStatus.pendingPaymentReview,
          startDate,
          endDate,
          rentalDays,
          deliveryMethod,
          deliveryFee,
          productPriceSnapshot: product.pricePerDay,
          depositSnapshot: product.depositAmount,
          rentalFee,
          platformFeeRateSnapshot: platformFeeRate,
          platformFeeAmount,
          ownerReceivableAmount,
          totalAmount,
          pickupAddressSnapshot: formatAddress(product.pickupAddress),
          payments: {
            create: {
              payerId: context.user.id,
              platformPaymentAccountId: paymentAccount.id,
              attemptNo: 1,
              status: PaymentStatus.pendingReview,
              proofStoragePath,
              proofFileName,
              submittedAmount: totalAmount,
              submittedAt: new Date(),
            },
          },
        },
        include: renterBookingInclude,
      })
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      const { error: cleanupError } = await supabase.storage
        .from(proofBucket)
        .remove([proofStoragePath])
      if (cleanupError) {
        console.error('Failed to remove orphaned payment proof', cleanupError)
      }
      throw error
    }

    const response = NextResponse.json(
      { data: serializeRenterBooking(booking, 'renter') },
      { status: 201 },
    )
    if (context.refreshedSession) {
      setSessionCookies(response, context.refreshedSession)
    }
    return response
  } catch (error) {
    if (error instanceof BookingRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Error && error.message.endsWith(' is invalid')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Failed to create booking', error)
    return NextResponse.json(
      { error: 'Unable to submit the rental request.' },
      { status: 500 },
    )
  }
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

function bookingFilter(filter: string | null) {
  if (filter === 'completed') {
    return { status: BookingStatus.completed }
  }
  if (filter === 'cancelled') {
    return {
      status: {
        in: [BookingStatus.cancelled, BookingStatus.expired],
      },
    }
  }
  if (filter === 'ongoing') {
    return {
      status: {
        notIn: [
          BookingStatus.completed,
          BookingStatus.cancelled,
          BookingStatus.expired,
        ],
      },
    }
  }
  return {}
}

function positiveBigInt(value: unknown, field: string) {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${field} is invalid`)
  }
  return BigInt(parsed)
}

function parseDate(value: unknown, field: string) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} is invalid`)
  }
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} is invalid`)
  }
  return date
}

function parseDeliveryMethod(value: unknown) {
  const methods: Record<string, DeliveryMethod> = {
    pickup: DeliveryMethod.pickup,
    grab: DeliveryMethod.messenger,
    messenger: DeliveryMethod.messenger,
    post: DeliveryMethod.shipping,
    shipping: DeliveryMethod.shipping,
  }
  if (typeof value !== 'string' || !methods[value]) {
    throw new Error('deliveryMethod is invalid')
  }
  return methods[value]
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is invalid`)
  }
  return value.trim()
}

function inclusiveDays(startDate: Date, endDate: Date) {
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ))
}

function createBookingNo() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `GF-${date}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function formatAddress(address: {
  addressLine: string
  subdistrict: string | null
  district: string | null
  province: string
  postalCode: string | null
}) {
  return [
    address.addressLine,
    address.subdistrict,
    address.district,
    address.province,
    address.postalCode,
  ].filter(Boolean).join(' ')
}

class BookingRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}
