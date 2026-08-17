import { NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { decryptBankAccountNumber } from '@/lib/bankAccountEncryption'
import { prisma } from '@/lib/prisma'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    const { id } = await context.params
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Bank account id is invalid.' }, { status: 400 })
    const account = await prisma.bankAccount.findUnique({ where: { id: BigInt(id) }, select: { accountNumberEncrypted: true } })
    if (!account) return NextResponse.json({ error: 'Bank account was not found.' }, { status: 404 })
    const response = NextResponse.json({ data: { accountNumber: decryptBankAccountNumber(account.accountNumberEncrypted) } }, { headers: { 'Cache-Control': 'no-store, private' } })
    if (admin.refreshedSession) setSessionCookies(response, admin.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to reveal payout account', error)
    return NextResponse.json({ error: 'Unable to reveal account number.' }, { status: 500 })
  }
}
