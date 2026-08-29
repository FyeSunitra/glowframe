import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

import { getBeamMerchantId, verifyBeamWebhook } from '@/lib/beam'
import { bahtToSatang, findPhotoboothPaymentByProvider } from '@/lib/photoboothPayments'
import { prisma } from '@/lib/prisma'

interface BeamWebhookCharge {
  chargeId?: string
  referenceId?: string
  merchantId?: string
  amount?: number
  currency?: string
  failureCode?: string
  transactionTime?: string
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  try {
    if (!verifyBeamWebhook(rawBody, request.headers.get('x-beam-signature'))) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 })
    }

    const event = request.headers.get('x-beam-event')?.toLowerCase()
    if (event !== 'charge.succeeded' && event !== 'charge.failed') {
      return NextResponse.json({ received: true, ignored: true })
    }

    const parsed = JSON.parse(rawBody) as BeamWebhookCharge & { data?: BeamWebhookCharge }
    const charge = parsed.data ?? parsed
    if (!charge.chargeId || charge.merchantId !== getBeamMerchantId()) {
      return NextResponse.json({ error: 'Webhook charge identity is invalid.' }, { status: 400 })
    }

    const payment = await findPhotoboothPaymentByProvider(charge.chargeId, charge.referenceId)
    if (!payment) return NextResponse.json({ received: true, ignored: true })
    if (
      payment.beam_charge_id !== charge.chargeId ||
      payment.reference_id !== charge.referenceId ||
      charge.currency !== payment.currency ||
      charge.amount !== bahtToSatang(payment.amount)
    ) {
      return NextResponse.json({ error: 'Webhook charge does not match the payment.' }, { status: 400 })
    }

    if (event === 'charge.succeeded') {
      const providerPaidAt = charge.transactionTime ? new Date(charge.transactionTime) : new Date()
      const paidAt = Number.isNaN(providerPaidAt.getTime()) ? new Date() : providerPaidAt
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "photobooth_payments"
        SET "status" = 'succeeded', "paid_at" = COALESCE("paid_at", ${paidAt}),
            "access_expires_at" = COALESCE("access_expires_at", ${paidAt} + INTERVAL '24 hours'),
            "failure_code" = NULL, "updated_at" = NOW()
        WHERE "id" = ${payment.id} AND "status" <> 'succeeded'
      `)
    } else {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "photobooth_payments"
        SET "status" = 'failed', "failure_code" = ${charge.failureCode ?? 'provider_failed'}, "updated_at" = NOW()
        WHERE "id" = ${payment.id} AND "status" = 'pending'
      `)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Failed to process Beam Photobooth webhook', error)
    const missingSecret = error instanceof Error && error.message.includes('BEAM_WEBHOOK_HMAC_KEY')
    return NextResponse.json(
      { error: missingSecret ? 'Beam webhook is not configured.' : 'Unable to process webhook.' },
      { status: missingSecret ? 503 : 400 },
    )
  }
}
