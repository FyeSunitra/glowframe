import { NextRequest, NextResponse } from 'next/server'

import { bankAccountInclude, maskAccountNumber, normalizeAccountNumber, serializeBankAccount } from '../../_utils'
import { setSessionCookies } from '@/lib/auth/server'
import { getUserRequestContext } from '@/lib/auth/userRequest'
import { encryptBankAccountNumber } from '@/lib/bankAccountEncryption'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserRequestContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    const id = await accountId(context)
    if (!id) return NextResponse.json({ error: 'Bank account id is invalid.' }, { status: 400 })
    const existing = await prisma.bankAccount.findFirst({ where: { id, userId: auth.user.id } })
    if (!existing) return NextResponse.json({ error: 'Bank account was not found.' }, { status: 404 })
    const body = await request.json()
    const bankId = parseId(body.bankId)
    const accountName = typeof body.accountName === 'string' ? body.accountName.trim() : ''
    const accountNumber = body.accountNumber ? normalizeAccountNumber(body.accountNumber) : null
    if (!bankId || accountName.length < 2 || accountName.length > 160 || (body.accountNumber && !accountNumber)) return NextResponse.json({ error: 'Bank account information is invalid.' }, { status: 400 })
    const bank = await prisma.bank.findFirst({ where: { id: bankId, isActive: true } })
    if (!bank) return NextResponse.json({ error: 'Bank was not found.' }, { status: 404 })
    const detailsChanged = bank.id !== existing.bankId || accountName !== existing.accountName || !!accountNumber
    const account = await prisma.$transaction(async (transaction) => {
      if (body.isDefault === true) await transaction.bankAccount.updateMany({ where: { userId: auth.user.id }, data: { isDefault: false } })
      return transaction.bankAccount.update({ where: { id }, data: {
        bankId: bank.id, bankName: bank.name, accountName,
        ...(accountNumber ? { accountNumberEncrypted: encryptBankAccountNumber(accountNumber), accountNumberLast4: accountNumber.slice(-4), accountNumberMasked: maskAccountNumber(accountNumber) } : {}),
        ...(detailsChanged ? { verificationStatus: 'pending' as const, verifiedByAdmin: false, verifiedBy: null, verifiedAt: null, verificationReason: null } : {}),
        ...(body.isDefault === true ? { isDefault: true } : {}),
      }, include: bankAccountInclude })
    })
    const response = NextResponse.json({ data: serializeBankAccount(account) })
    if (auth.refreshedSession) setSessionCookies(response, auth.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to update bank account', error)
    return NextResponse.json({ error: 'Unable to update bank account.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserRequestContext()
    if (!auth) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    const id = await accountId(context)
    if (!id) return NextResponse.json({ error: 'Bank account id is invalid.' }, { status: 400 })
    const account = await prisma.bankAccount.findFirst({ where: { id, userId: auth.user.id }, select: { isDefault: true } })
    if (!account) return NextResponse.json({ error: 'Bank account was not found.' }, { status: 404 })
    if (await prisma.withdrawal.count({ where: { bankAccountId: id } }) > 0) return NextResponse.json({ error: 'This account is used by a withdrawal and cannot be deleted.' }, { status: 409 })
    await prisma.$transaction(async (transaction) => {
      await transaction.bankAccount.delete({ where: { id } })
      if (account.isDefault) {
        const next = await transaction.bankAccount.findFirst({ where: { userId: auth.user.id }, orderBy: { createdAt: 'desc' } })
        if (next) await transaction.bankAccount.update({ where: { id: next.id }, data: { isDefault: true } })
      }
    })
    const response = NextResponse.json({ data: null })
    if (auth.refreshedSession) setSessionCookies(response, auth.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to delete bank account', error)
    return NextResponse.json({ error: 'Unable to delete bank account.' }, { status: 500 })
  }
}

async function accountId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return /^\d+$/.test(id) ? BigInt(id) : null
}

function parseId(value: unknown) {
  if ((typeof value !== 'number' && typeof value !== 'string') || !/^\d+$/.test(String(value))) return null
  return BigInt(value)
}
