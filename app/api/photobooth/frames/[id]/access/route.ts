import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

import { findPhotoboothPayment, serializePayment } from '@/lib/photoboothPayments'
import { getPhotoboothSessionId } from '@/lib/photoboothPaymentSession'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Frame not found.' }, { status: 404 })

  try {
    const frames = await prisma.$queryRaw<Array<{ id: bigint; price: Prisma.Decimal | null }>>(Prisma.sql`
      SELECT "id", "price" FROM "photobooth_frames"
      WHERE "id" = ${BigInt(id)} AND "is_active" = TRUE
      LIMIT 1
    `)
    const frame = frames[0]
    if (!frame) return NextResponse.json({ error: 'Frame not found.' }, { status: 404 })
    if (!frame.price || Number(frame.price) <= 0) {
      return NextResponse.json({ data: { allowed: true, requiresPayment: false } })
    }

    const paymentId = request.nextUrl.searchParams.get('paymentId')
    const sessionId = await getPhotoboothSessionId()
    if (!paymentId || !/^\d+$/.test(paymentId) || !sessionId) {
      return NextResponse.json({ data: { allowed: false, requiresPayment: true } }, { status: 402 })
    }
    const payment = await findPhotoboothPayment(BigInt(paymentId), sessionId)
    const allowed = Boolean(
      payment &&
      payment.frame_id === frame.id &&
      payment.status === 'succeeded' &&
      payment.access_expires_at &&
      payment.access_expires_at > new Date(),
    )
    return NextResponse.json({
      data: {
        allowed,
        requiresPayment: true,
        ...(payment ? { payment: serializePayment(payment) } : {}),
      },
    }, { status: allowed ? 200 : 402 })
  } catch (error) {
    console.error('Failed to verify Photobooth frame access', error)
    return NextResponse.json({ error: 'Unable to verify frame access.' }, { status: 500 })
  }
}
