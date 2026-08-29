import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

import { BeamApiError, createBeamQrCharge } from '@/lib/beam'
import { bahtToSatang, type PhotoboothPaymentRow, serializePayment } from '@/lib/photoboothPayments'
import { ensurePhotoboothSession, setPhotoboothSessionCookie } from '@/lib/photoboothPaymentSession'
import { prisma } from '@/lib/prisma'

interface FramePriceRow {
  id: bigint
  price: Prisma.Decimal | null
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { frameId?: unknown }
    const frameId = parsePositiveBigInt(body.frameId)
    if (!frameId) return NextResponse.json({ error: 'A valid frameId is required.' }, { status: 400 })

    const frames = await prisma.$queryRaw<FramePriceRow[]>(Prisma.sql`
      SELECT "id", "price"
      FROM "photobooth_frames"
      WHERE "id" = ${frameId} AND "is_active" = TRUE
      LIMIT 1
    `)
    const frame = frames[0]
    if (!frame) return NextResponse.json({ error: 'Frame not found.' }, { status: 404 })
    if (!frame.price || Number(frame.price) <= 0) {
      return NextResponse.json({ error: 'This frame does not require payment.' }, { status: 409 })
    }

    const session = await ensurePhotoboothSession()
    const referenceId = `GF-PB-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`
    const qrExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const inserted = await prisma.$queryRaw<PhotoboothPaymentRow[]>(Prisma.sql`
      INSERT INTO "photobooth_payments"
        ("frame_id", "guest_session_id", "reference_id", "amount", "currency", "status", "qr_expires_at", "created_at", "updated_at")
      VALUES
        (${frame.id}, ${session.id}::uuid, ${referenceId}, ${frame.price}, 'THB', 'pending', ${qrExpiresAt}, NOW(), NOW())
      RETURNING "id", "frame_id", "guest_session_id", "reference_id", "beam_charge_id",
                "amount", "currency", "status", "failure_code", "qr_expires_at",
                "access_expires_at", "paid_at"
    `)
    const payment = inserted[0]

    try {
      const charge = await createBeamQrCharge({
        amountSatang: bahtToSatang(frame.price),
        expiryTime: qrExpiresAt.toISOString(),
        referenceId,
        returnUrl: `${request.nextUrl.origin}/photobooth?paymentId=${payment.id}`,
      })
      const providerExpiry = charge.expiry ? new Date(charge.expiry) : qrExpiresAt
      const finalExpiry = Number.isNaN(providerExpiry.getTime()) ? qrExpiresAt : providerExpiry
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "photobooth_payments"
        SET "beam_charge_id" = ${charge.chargeId}, "qr_expires_at" = ${finalExpiry}, "updated_at" = NOW()
        WHERE "id" = ${payment.id}
      `)

      const response = NextResponse.json({
        data: {
          ...serializePayment({
            ...payment,
            beam_charge_id: charge.chargeId,
            qr_expires_at: finalExpiry,
          }),
          qrImageBase64: normalizeQrImage(charge.imageBase64Encoded),
        },
      }, { status: 201 })
      if (session.isNew) setPhotoboothSessionCookie(response, session.id)
      return response
    } catch (error) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE "photobooth_payments"
        SET "status" = 'failed', "failure_code" = 'provider_create_failed', "updated_at" = NOW()
        WHERE "id" = ${payment.id} AND "status" = 'pending'
      `)
      throw error
    }
  } catch (error) {
    console.error('Failed to create a Photobooth Beam payment', error)
    const status = error instanceof BeamApiError ? 502 : 500
    return NextResponse.json({ error: 'Unable to create the payment QR.' }, { status })
  }
}

function parsePositiveBigInt(value: unknown) {
  const normalized = typeof value === 'number' ? String(value) : value
  if (typeof normalized !== 'string' || !/^\d+$/.test(normalized)) return null
  const parsed = BigInt(normalized)
  return parsed > BigInt(0) ? parsed : null
}

function normalizeQrImage(value: string) {
  return value.startsWith('data:image/') ? value : `data:image/png;base64,${value}`
}
