import 'server-only'

import { Prisma } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export type PhotoboothPaymentStatus = 'pending' | 'succeeded' | 'failed' | 'expired' | 'cancelled'

export interface PhotoboothPaymentRow {
  id: bigint
  frame_id: bigint
  guest_session_id: string
  reference_id: string
  beam_charge_id: string | null
  amount: Prisma.Decimal
  currency: string
  status: PhotoboothPaymentStatus
  failure_code: string | null
  qr_expires_at: Date | null
  access_expires_at: Date | null
  paid_at: Date | null
  completed_at: Date | null
}

export async function findPhotoboothPayment(id: bigint, guestSessionId: string) {
  const rows = await prisma.$queryRaw<PhotoboothPaymentRow[]>(Prisma.sql`
    SELECT "id", "frame_id", "guest_session_id", "reference_id", "beam_charge_id",
           "amount", "currency", "status", "failure_code", "qr_expires_at",
           "access_expires_at", "paid_at", "completed_at"
    FROM "photobooth_payments"
    WHERE "id" = ${id} AND "guest_session_id" = ${guestSessionId}::uuid
    LIMIT 1
  `)
  return rows[0] ?? null
}

export async function findPhotoboothPaymentByProvider(chargeId: string, referenceId?: string) {
  const rows = await prisma.$queryRaw<PhotoboothPaymentRow[]>(Prisma.sql`
    SELECT "id", "frame_id", "guest_session_id", "reference_id", "beam_charge_id",
           "amount", "currency", "status", "failure_code", "qr_expires_at",
           "access_expires_at", "paid_at", "completed_at"
    FROM "photobooth_payments"
    WHERE "beam_charge_id" = ${chargeId}
       OR (${referenceId ?? ''} <> '' AND "reference_id" = ${referenceId ?? ''})
    LIMIT 1
  `)
  return rows[0] ?? null
}

export function bahtToSatang(value: Prisma.Decimal | string | number) {
  const normalized = String(value)
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized)
  if (!match) throw new Error('The frame price is invalid.')
  const satang = BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? '').padEnd(2, '0'))
  if (satang <= BigInt(0) || satang > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('The frame price is invalid.')
  }
  return Number(satang)
}

export function serializePayment(payment: PhotoboothPaymentRow) {
  return {
    id: Number(payment.id),
    frameId: Number(payment.frame_id),
    referenceId: payment.reference_id,
    amount: Number(payment.amount),
    currency: payment.currency,
    status: payment.status,
    expiresAt: payment.qr_expires_at?.toISOString() ?? null,
    accessExpiresAt: payment.access_expires_at?.toISOString() ?? null,
    paidAt: payment.paid_at?.toISOString() ?? null,
    completedAt: payment.completed_at?.toISOString() ?? null,
  }
}

export async function completePhotoboothPayment(id: bigint, guestSessionId: string) {
  const rows = await prisma.$queryRaw<Array<{ completed_at: Date }>>(Prisma.sql`
    UPDATE "photobooth_payments"
    SET "completed_at" = NOW()
    WHERE "id" = ${id}
      AND "guest_session_id" = ${guestSessionId}::uuid
      AND "status" = 'succeeded'
      AND "completed_at" IS NULL
    RETURNING "completed_at"
  `)
  return rows[0] ?? null
}
