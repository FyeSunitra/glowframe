import { NextRequest, NextResponse } from 'next/server'

import { payoutInclude, serializePayout } from './_utils'
import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { createSupabaseAuthClient, setSessionCookies } from '@/lib/auth/server'
import { Prisma, WithdrawalStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    const page = positiveInteger(request.nextUrl.searchParams.get('page'), 1)
    const limit = Math.min(positiveInteger(request.nextUrl.searchParams.get('limit'), 10), 50)
    const tab = request.nextUrl.searchParams.get('tab') === 'history' ? 'history' : 'pending'
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const statusParam = request.nextUrl.searchParams.get('status')
    const historyStatus = statusParam === 'approved' || statusParam === 'rejected' || statusParam === 'cancelled'
      ? statusParam as WithdrawalStatus
      : undefined
    const where: Prisma.WithdrawalWhereInput = {
      status: tab === 'pending' ? WithdrawalStatus.pending : historyStatus ?? { not: WithdrawalStatus.pending },
      ...(search ? { OR: [
        { user: { displayName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { bankAccount: { bankName: { contains: search, mode: 'insensitive' } } },
        { bankAccount: { accountNumberMasked: { contains: search, mode: 'insensitive' } } },
      ] } : {}),
    }
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const [items, total, paid, pendingCount, thisMonth] = await Promise.all([
      prisma.withdrawal.findMany({ where, include: payoutInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.withdrawal.count({ where }),
      prisma.withdrawal.aggregate({ where: { status: WithdrawalStatus.approved }, _sum: { amount: true } }),
      prisma.withdrawal.count({ where: { status: WithdrawalStatus.pending } }),
      prisma.withdrawal.aggregate({ where: { status: WithdrawalStatus.approved, reviewedAt: { gte: monthStart } }, _sum: { amount: true } }),
    ])
    let storage: ReturnType<typeof createSupabaseAuthClient>['storage'] | null = null
    if (admin.accessToken && admin.refreshToken) {
      const supabase = createSupabaseAuthClient()
      const { error } = await supabase.auth.setSession({ access_token: admin.accessToken, refresh_token: admin.refreshToken })
      if (!error) storage = supabase.storage
    }
    const bucket = process.env.SUPABASE_PAYOUT_BUCKET ?? process.env.SUPABASE_PAYMENT_BUCKET ?? 'payout-proofs'
    const serializedItems = await Promise.all(items.map(async (item) => {
      const signed = storage && item.transferProofStoragePath
        ? await storage.from(bucket).createSignedUrl(item.transferProofStoragePath, 300)
        : null
      return serializePayout(item, signed?.data?.signedUrl ?? null)
    }))
    const response = NextResponse.json({ data: {
      items: serializedItems,
      stats: { totalPaid: Number(paid._sum.amount ?? 0), pendingCount, thisMonth: Number(thisMonth._sum.amount ?? 0) },
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    } })
    if (admin.refreshedSession) setSessionCookies(response, admin.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to load payouts', error)
    return NextResponse.json({ error: 'Unable to load payouts.' }, { status: 500 })
  }
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
