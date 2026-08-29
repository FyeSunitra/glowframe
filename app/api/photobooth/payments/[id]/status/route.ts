import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

import { getBeamCharge, getBeamMerchantId } from '@/lib/beam'
import { bahtToSatang, findPhotoboothPayment, serializePayment } from '@/lib/photoboothPayments'
import { getPhotoboothSessionId } from '@/lib/photoboothPaymentSession'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  const sessionId = await getPhotoboothSessionId()
  if (!sessionId) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  try {
    let payment = await findPhotoboothPayment(BigInt(id), sessionId)
    if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

    if (payment.status === 'pending' && payment.beam_charge_id) {
      try {
        const charge = await getBeamCharge(payment.beam_charge_id)
        const normalized = charge.status?.toUpperCase()
        if (normalized === 'SUCCEEDED') {
          if (
            charge.chargeId !== payment.beam_charge_id ||
            charge.referenceId !== payment.reference_id ||
            charge.merchantId !== getBeamMerchantId() ||
            charge.currency !== payment.currency ||
            charge.amount !== bahtToSatang(payment.amount)
          ) {
            throw new Error('Beam charge does not match the payment.')
          }
          await prisma.$executeRaw(Prisma.sql`
            UPDATE "photobooth_payments"
            SET "status" = 'succeeded', "paid_at" = COALESCE("paid_at", NOW()),
                "access_expires_at" = COALESCE("access_expires_at", NOW() + INTERVAL '24 hours'),
                "failure_code" = NULL, "updated_at" = NOW()
            WHERE "id" = ${payment.id} AND "status" = 'pending'
          `)
        } else if (normalized === 'FAILED') {
          await prisma.$executeRaw(Prisma.sql`
            UPDATE "photobooth_payments"
            SET "status" = 'failed', "failure_code" = ${charge.failureCode ?? 'provider_failed'}, "updated_at" = NOW()
            WHERE "id" = ${payment.id} AND "status" = 'pending'
          `)
        }
      } catch (error) {
        console.error('Unable to reconcile Photobooth payment with Beam', error)
      }
    }

    if (payment.status === 'pending' && payment.qr_expires_at && payment.qr_expires_at <= new Date()) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "photobooth_payments"
        SET "status" = 'expired', "updated_at" = NOW()
        WHERE "id" = ${payment.id} AND "status" = 'pending'
      `)
    }

    payment = (await findPhotoboothPayment(BigInt(id), sessionId)) ?? payment
    return NextResponse.json({ data: serializePayment(payment) })
  } catch (error) {
    console.error('Failed to load Photobooth payment status', error)
    return NextResponse.json({ error: 'Unable to load payment status.' }, { status: 500 })
  }
}
