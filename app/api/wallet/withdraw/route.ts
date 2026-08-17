import { NextRequest, NextResponse } from 'next/server'

import { bankAccountInclude, serializeBankAccount } from '../_utils'
import { setSessionCookies } from '@/lib/auth/server'
import { getUserRequestContext } from '@/lib/auth/userRequest'
import { BankAccountVerificationStatus, Prisma, WithdrawalStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserRequestContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    const body = await request.json()
    const amountText = String(body.amount ?? '').trim()
    const amount = Number(amountText)
    const bankAccountId = parseId(body.bankAccountId)
    if (!bankAccountId || !/^\d+(\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Withdrawal information is invalid.' }, { status: 400 })
    }
    const result = await prisma.$transaction(async (transaction) => {
      const [wallet, bankAccount, pending, settings] = await Promise.all([
        transaction.wallet.upsert({ where: { userId: auth.user.id }, create: { userId: auth.user.id }, update: {} }),
        transaction.bankAccount.findFirst({ where: { id: bankAccountId, userId: auth.user.id, verificationStatus: BankAccountVerificationStatus.approved }, include: bankAccountInclude }),
        transaction.withdrawal.aggregate({ where: { userId: auth.user.id, status: WithdrawalStatus.pending }, _sum: { amount: true } }),
        transaction.platformSetting.findUnique({ where: { id: 1 }, select: { minPayout: true } }),
      ])
      if (!bankAccount) throw new WithdrawalError('An approved bank account is required.', 409)
      if (amount < Number(settings?.minPayout ?? 0)) throw new WithdrawalError(`Minimum withdrawal is ${Number(settings?.minPayout ?? 0)} THB.`, 409)
      const available = Number(wallet.simulatedBalance) - Number(pending._sum.amount ?? 0)
      if (amount > available) throw new WithdrawalError('Insufficient available balance.', 409)
      const withdrawal = await transaction.withdrawal.create({
        data: { userId: auth.user.id, walletId: wallet.id, bankAccountId, amount: amount.toFixed(2) },
      })
      return { withdrawal, bankAccount }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    const response = NextResponse.json({ data: {
      id: Number(result.withdrawal.id), amount: Number(result.withdrawal.amount), status: result.withdrawal.status,
      bankAccount: serializeBankAccount(result.bankAccount), rejectionReason: null, reviewedAt: null,
      createdAt: result.withdrawal.createdAt.toISOString(),
    } }, { status: 201 })
    if (auth.refreshedSession) setSessionCookies(response, auth.refreshedSession)
    return response
  } catch (error) {
    if (error instanceof WithdrawalError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Failed to submit withdrawal', error)
    return NextResponse.json({ error: 'Unable to submit withdrawal request.' }, { status: 500 })
  }
}

class WithdrawalError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

function parseId(value: unknown) {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^\d+$/.test(String(value))) return null
  return BigInt(value)
}
