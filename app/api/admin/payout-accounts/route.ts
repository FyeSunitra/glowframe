import { NextRequest, NextResponse } from 'next/server'

import { adminBankAccountInclude, serializeAdminBankAccount } from './_utils'
import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { BankAccountVerificationStatus, Prisma } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    const page = positiveInteger(request.nextUrl.searchParams.get('page'), 1)
    const limit = Math.min(positiveInteger(request.nextUrl.searchParams.get('limit'), 10), 50)
    const tab = request.nextUrl.searchParams.get('tab') === 'history' ? 'history' : 'pending'
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const where: Prisma.BankAccountWhereInput = {
      verificationStatus: tab === 'pending' ? BankAccountVerificationStatus.pending : { not: BankAccountVerificationStatus.pending },
      ...(search ? { OR: [
        { user: { displayName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { accountName: { contains: search, mode: 'insensitive' } },
        { accountNumberMasked: { contains: search, mode: 'insensitive' } },
        { bankName: { contains: search, mode: 'insensitive' } },
      ] } : {}),
    }
    const [items, total] = await Promise.all([
      prisma.bankAccount.findMany({ where, include: adminBankAccountInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.bankAccount.count({ where }),
    ])
    const response = NextResponse.json({ data: { items: items.map(serializeAdminBankAccount), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } } })
    if (admin.refreshedSession) setSessionCookies(response, admin.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to load payout accounts', error)
    return NextResponse.json({ error: 'Unable to load payout accounts.' }, { status: 500 })
  }
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
