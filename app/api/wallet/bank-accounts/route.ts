import { NextRequest, NextResponse } from 'next/server'

import { bankAccountInclude, maskAccountNumber, normalizeAccountNumber, serializeBankAccount } from '../_utils'
import { setSessionCookies } from '@/lib/auth/server'
import { getUserRequestContext } from '@/lib/auth/userRequest'
import { encryptBankAccountNumber } from '@/lib/bankAccountEncryption'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const auth = await getUserRequestContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    const accounts = await prisma.bankAccount.findMany({ where: { userId: auth.user.id }, include: bankAccountInclude, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] })
    const response = NextResponse.json({ data: accounts.map(serializeBankAccount) })
    if (auth.refreshedSession) setSessionCookies(response, auth.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to load bank accounts', error)
    return NextResponse.json({ error: 'Unable to load bank accounts.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getUserRequestContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    const body = await request.json()
    const bankId = parseId(body.bankId)
    const accountName = typeof body.accountName === 'string' ? body.accountName.trim() : ''
    const accountNumber = normalizeAccountNumber(body.accountNumber)
    if (!bankId || accountName.length < 2 || accountName.length > 160 || !accountNumber) return NextResponse.json({ error: 'Bank account information is invalid.' }, { status: 400 })
    const [bank, count] = await Promise.all([prisma.bank.findFirst({ where: { id: bankId, isActive: true } }), prisma.bankAccount.count({ where: { userId: auth.user.id } })])
    if (!bank) return NextResponse.json({ error: 'Bank was not found.' }, { status: 404 })
    const makeDefault = count === 0 || body.isDefault === true
    const account = await prisma.$transaction(async (transaction) => {
      if (makeDefault) await transaction.bankAccount.updateMany({ where: { userId: auth.user.id }, data: { isDefault: false } })
      return transaction.bankAccount.create({ data: {
        userId: auth.user.id, bankId: bank.id, bankName: bank.name, accountName,
        accountNumberEncrypted: encryptBankAccountNumber(accountNumber), accountNumberLast4: accountNumber.slice(-4),
        accountNumberMasked: maskAccountNumber(accountNumber), isDefault: makeDefault,
        verificationStatus: 'pending', verifiedByAdmin: false,
      }, include: bankAccountInclude })
    })
    const response = NextResponse.json({ data: serializeBankAccount(account) }, { status: 201 })
    if (auth.refreshedSession) setSessionCookies(response, auth.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to create bank account', error)
    const message = error instanceof Error && error.message.includes('BANK_ACCOUNT_ENCRYPTION_KEY') ? error.message : 'Unable to save bank account.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function parseId(value: unknown) {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^\d+$/.test(String(value))) return null
  return BigInt(value)
}
