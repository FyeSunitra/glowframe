import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import {
  createSupabaseAuthClient,
  setSessionCookies,
} from '@/lib/auth/server'
import { PaymentStatus, Prisma } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import {
  adminTransactionInclude,
  serializeAdminTransaction,
} from './_utils'

const paymentStatuses = new Set(Object.values(PaymentStatus))

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const page = positiveInteger(request.nextUrl.searchParams.get('page'), 1)
    const limit = Math.min(
      positiveInteger(request.nextUrl.searchParams.get('limit'), 10),
      50,
    )
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const method = request.nextUrl.searchParams.get('method')
    const statusParam = request.nextUrl.searchParams.get('status')
    const status = statusParam && paymentStatuses.has(statusParam as PaymentStatus)
      ? statusParam as PaymentStatus
      : undefined

    const where: Prisma.PaymentWhereInput = {
      ...(status ? { status } : {}),
      ...(method === 'promptpay'
        ? { platformPaymentAccount: { bank: { code: 'PROMPTPAY' } } }
        : method === 'bank_transfer'
          ? { platformPaymentAccount: { bank: { code: { not: 'PROMPTPAY' } } } }
          : {}),
      ...(search
        ? {
            OR: [
              { booking: { bookingNo: { contains: search, mode: 'insensitive' } } },
              { payer: { displayName: { contains: search, mode: 'insensitive' } } },
              { payer: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [payments, total, settings] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: adminTransactionInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.platformSetting.findUnique({
        where: { id: 1 },
        select: { platformFee: true },
      }),
    ])
    const platformFeeRate = Number(settings?.platformFee ?? 0)
    let storage:
      | ReturnType<typeof createSupabaseAuthClient>['storage']
      | null = null
    if (admin.accessToken && admin.refreshToken) {
      const supabase = createSupabaseAuthClient()
      const { error } = await supabase.auth.setSession({
        access_token: admin.accessToken,
        refresh_token: admin.refreshToken,
      })
      if (!error) storage = supabase.storage
    }
    const proofBucket =
      process.env.SUPABASE_PAYMENT_BUCKET ??
      process.env.SUPABASE_IDENTITY_BUCKET ??
      'identity-documents'
    const data = await Promise.all(payments.map(async (payment) => {
      const signed = storage && payment.proofStoragePath
        ? await storage
            .from(proofBucket)
            .createSignedUrl(payment.proofStoragePath, 300)
        : null
      if (signed?.error) {
        console.error('Failed to create payment-proof signed URL', {
          paymentId: payment.id.toString(),
          message: signed.error.message,
        })
      }
      return serializeAdminTransaction(
        payment,
        platformFeeRate,
        signed?.data?.signedUrl ?? null,
      )
    }))

    const response = NextResponse.json({
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load admin transactions', error)
    return NextResponse.json(
      { error: 'Unable to load payment transactions.' },
      { status: 500 },
    )
  }
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
