import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  ReturnStatus,
  WalletEntryType,
} from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import {
  adminDisputeInclude,
  serializeAdminDispute,
} from '../_utils'

const decisions = new Set([
  'no_damage',
  'partial_damage',
  'full_damage',
])

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
      return NextResponse.json(
        { error: 'Damage claim id is invalid.' },
        { status: 400 },
      )
    }
    const body = await request.json()
    const decision =
      typeof body?.decision === 'string' && decisions.has(body.decision)
        ? body.decision
        : null
    const note = typeof body?.note === 'string' ? body.note.trim() : ''
    if (!decision || !note || note.length > 2000) {
      return NextResponse.json(
        { error: 'Decision and review note are required.' },
        { status: 400 },
      )
    }

    const returnId = BigInt(id)
    const existing = await prisma.rentalReturn.findUnique({
      where: { id: returnId },
      include: { booking: true },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Damage claim was not found.' },
        { status: 404 },
      )
    }
    if (
      existing.reviewedAt ||
      existing.status !== ReturnStatus.damageReported ||
      existing.booking.status !== BookingStatus.disputed
    ) {
      return NextResponse.json(
        { error: 'This damage claim has already been resolved.' },
        { status: 409 },
      )
    }

    const maximumDamage = existing.damageAmount.lessThan(
      existing.booking.depositSnapshot,
    )
      ? existing.damageAmount
      : existing.booking.depositSnapshot
    const approvedDamage = approvedAmount(
      decision,
      body?.approvedAmount,
      maximumDamage,
    )

    const updated = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.rentalReturn.updateMany({
        where: {
          id: returnId,
          status: ReturnStatus.damageReported,
          reviewedAt: null,
        },
        data: {
          status: ReturnStatus.completed,
          approvedDamageAmount: approvedDamage,
          adminDecision: decision,
          adminDecisionNote: note,
          reviewedBy: admin.user.id,
          reviewedAt: new Date(),
        },
      })
      if (claimed.count !== 1) {
        throw new DamageResolutionError(
          'This damage claim has already been resolved.',
        )
      }

      await transaction.booking.update({
        where: { id: existing.bookingId },
        data: {
          status: BookingStatus.completed,
          completedAt: new Date(),
        },
      })

      const [ownerWallet, renterWallet] = await Promise.all([
        transaction.wallet.upsert({
          where: { userId: existing.booking.ownerId },
          create: { userId: existing.booking.ownerId },
          update: {},
        }),
        transaction.wallet.upsert({
          where: { userId: existing.booking.renterId },
          create: { userId: existing.booking.renterId },
          update: {},
        }),
      ])
      const ownerCredit = existing.booking.rentalFee.add(approvedDamage)
      const renterRefund =
        existing.booking.depositSnapshot.sub(approvedDamage)

      await transaction.wallet.update({
        where: { id: ownerWallet.id },
        data: { simulatedBalance: { increment: ownerCredit } },
      })
      if (renterRefund.greaterThan(0)) {
        await transaction.wallet.update({
          where: { id: renterWallet.id },
          data: { simulatedBalance: { increment: renterRefund } },
        })
      }

      const entries: Prisma.WalletEntryCreateManyInput[] = [
        {
          walletId: ownerWallet.id,
          bookingId: existing.bookingId,
          entryType: WalletEntryType.rentalIncome,
          amount: existing.booking.rentalFee,
          description: 'Rental income after damage claim resolution',
        },
      ]
      if (approvedDamage.greaterThan(0)) {
        entries.push({
          walletId: ownerWallet.id,
          bookingId: existing.bookingId,
          entryType: WalletEntryType.damageDeduction,
          amount: approvedDamage,
          description: 'Approved damage compensation',
        })
      }
      if (renterRefund.greaterThan(0)) {
        entries.push({
          walletId: renterWallet.id,
          bookingId: existing.bookingId,
          entryType: WalletEntryType.depositReturn,
          amount: renterRefund,
          description: 'Remaining deposit after damage claim resolution',
        })
      }
      await transaction.walletEntry.createMany({ data: entries })
      await transaction.payment.updateMany({
        where: {
          bookingId: existing.bookingId,
          status: PaymentStatus.approved,
        },
        data: { platformHeldAmount: 0 },
      })

      return transaction.rentalReturn.findUniqueOrThrow({
        where: { id: returnId },
        include: adminDisputeInclude,
      })
    })

    const response = NextResponse.json({
      data: serializeAdminDispute(updated),
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    if (error instanceof DamageResolutionError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('Failed to resolve damage claim', error)
    return NextResponse.json(
      { error: 'Unable to resolve the damage claim.' },
      { status: 500 },
    )
  }
}

function approvedAmount(
  decision: string,
  rawAmount: unknown,
  maximum: Prisma.Decimal,
) {
  if (decision === 'no_damage') return new Prisma.Decimal(0)
  if (decision === 'full_damage') return maximum

  const amount = Number(rawAmount)
  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isInteger(amount * 100)
  ) {
    throw new DamageResolutionError('Approved amount is invalid.')
  }
  const decimal = new Prisma.Decimal(amount)
  if (decimal.greaterThanOrEqualTo(maximum)) {
    throw new DamageResolutionError(
      'Partial damage amount must be less than the claim amount.',
    )
  }
  return decimal
}

class DamageResolutionError extends Error {}
