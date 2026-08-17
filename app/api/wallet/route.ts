import { NextRequest, NextResponse } from 'next/server'

import { setSessionCookies } from '@/lib/auth/server'
import { getUserRequestContext } from '@/lib/auth/userRequest'
import { WalletEntryType, WithdrawalStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const auth = await getUserRequestContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    const page = positiveInteger(request.nextUrl.searchParams.get('page'), 1)
    const limit = Math.min(positiveInteger(request.nextUrl.searchParams.get('limit'), 10), 50)
    const direction = request.nextUrl.searchParams.get('direction')
    const wallet = await prisma.wallet.upsert({ where: { userId: auth.user.id }, create: { userId: auth.user.id }, update: {} })
    const [entries, payments, withdrawals, pending] = await Promise.all([
      prisma.walletEntry.findMany({
        where: { walletId: wallet.id, entryType: { not: WalletEntryType.withdrawal } },
        include: { booking: { select: { bookingNo: true, product: { select: { title: true } } } } },
      }),
      prisma.payment.findMany({
        where: { payerId: auth.user.id },
        include: { booking: { select: { bookingNo: true, totalAmount: true, product: { select: { title: true } } } } },
      }),
      prisma.withdrawal.findMany({
        where: { userId: auth.user.id },
        include: { bankAccount: { select: { accountNumberMasked: true, bankName: true } } },
      }),
      prisma.withdrawal.aggregate({ where: { userId: auth.user.id, status: WithdrawalStatus.pending }, _sum: { amount: true } }),
    ])
    const transactions = [
      ...entries.map((entry) => ({
        id: `entry-${entry.id}`, type: entry.entryType,
        direction: Number(entry.amount) >= 0 ? 'incoming' as const : 'outgoing' as const,
        amount: Math.abs(Number(entry.amount)), status: 'completed',
        bookingNo: entry.booking?.bookingNo ?? null, productName: entry.booking?.product.title ?? null,
        description: entry.description, createdAt: entry.createdAt.toISOString(),
      })),
      ...payments.map((payment) => ({
        id: `payment-${payment.id}`, type: 'payment' as const, direction: 'outgoing' as const,
        amount: Number(payment.submittedAmount ?? payment.booking.totalAmount), status: payment.status,
        bookingNo: payment.booking.bookingNo, productName: payment.booking.product.title,
        description: payment.rejectionReason, createdAt: (payment.submittedAt ?? payment.createdAt).toISOString(),
      })),
      ...withdrawals.map((withdrawal) => ({
        id: `withdrawal-${withdrawal.id}`, type: 'withdrawal' as const, direction: 'outgoing' as const,
        amount: Number(withdrawal.amount), status: withdrawal.status, bookingNo: null, productName: null,
        description: withdrawal.rejectionReason ?? `${withdrawal.bankAccount.bankName} ${withdrawal.bankAccount.accountNumberMasked}`,
        createdAt: withdrawal.createdAt.toISOString(),
      })),
    ]
      .filter((item) => direction === 'incoming' || direction === 'outgoing' ? item.direction === direction : true)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    const total = transactions.length
    const pendingWithdrawal = Number(pending._sum.amount ?? 0)
    const balance = Number(wallet.simulatedBalance)
    const response = NextResponse.json({ data: {
      balance, pendingWithdrawal, availableBalance: Math.max(0, balance - pendingWithdrawal),
      transactions: transactions.slice((page - 1) * limit, page * limit),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    } })
    if (auth.refreshedSession) setSessionCookies(response, auth.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to load wallet', error)
    return NextResponse.json({ error: 'Unable to load wallet.' }, { status: 500 })
  }
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
