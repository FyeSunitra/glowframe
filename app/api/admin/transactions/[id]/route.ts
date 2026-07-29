import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import {
  BookingStatus,
  PaymentStatus,
} from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import {
  adminTransactionInclude,
  serializeAdminTransaction,
} from '../_utils'

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
      return NextResponse.json({ error: 'Payment id is invalid.' }, { status: 400 })
    }
    const body = await request.json()
    const approve = body?.action === 'approve_payment'
    const reject = body?.action === 'reject_payment'
    if (!approve && !reject) {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
    }
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (reject && !reason) {
      return NextResponse.json(
        { error: 'A rejection reason is required.' },
        { status: 400 },
      )
    }

    const existing = await prisma.payment.findUnique({
      where: { id: BigInt(id) },
      select: {
        status: true,
        bookingId: true,
        submittedAmount: true,
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Payment was not found.' }, { status: 404 })
    }
    if (existing.status !== PaymentStatus.pendingReview) {
      return NextResponse.json(
        { error: 'This payment has already been reviewed.' },
        { status: 409 },
      )
    }

    const payment = await prisma.$transaction(async (transaction) => {
      await transaction.booking.update({
        where: { id: existing.bookingId },
        data: {
          status: approve
            ? BookingStatus.paymentApproved
            : BookingStatus.paymentRejected,
        },
      })
      return transaction.payment.update({
        where: { id: BigInt(id) },
        data: {
          status: approve ? PaymentStatus.approved : PaymentStatus.rejected,
          reviewedBy: admin.user.id,
          reviewedAt: new Date(),
          rejectionReason: reject ? reason : null,
          platformHeldAmount: approve
            ? existing.submittedAmount ?? 0
            : 0,
        },
        include: adminTransactionInclude,
      })
    })
    const settings = await prisma.platformSetting.findUnique({
      where: { id: 1 },
      select: { platformFee: true },
    })

    const response = NextResponse.json({
      data: serializeAdminTransaction(
        payment,
        Number(settings?.platformFee ?? 0),
      ),
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to review payment evidence', error)
    return NextResponse.json(
      { error: 'Unable to review the payment evidence.' },
      { status: 500 },
    )
  }
}
