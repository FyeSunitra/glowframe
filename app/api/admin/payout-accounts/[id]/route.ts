import { NextRequest, NextResponse } from 'next/server'

import { adminBankAccountInclude, serializeAdminBankAccount } from '../_utils'
import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { BankAccountVerificationStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    const { id } = await context.params
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Bank account id is invalid.' }, { status: 400 })
    const body = await request.json()
    const approve = body.action === 'approve'
    const reject = body.action === 'reject'
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (!approve && !reject) return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
    if (reject && !reason) return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 })
    const claimed = await prisma.bankAccount.updateMany({
      where: { id: BigInt(id), verificationStatus: BankAccountVerificationStatus.pending },
      data: {
        verificationStatus: approve ? BankAccountVerificationStatus.approved : BankAccountVerificationStatus.rejected,
        verifiedByAdmin: approve, verifiedBy: admin.user.id, verifiedAt: new Date(), verificationReason: reject ? reason : null,
      },
    })
    if (claimed.count !== 1) return NextResponse.json({ error: 'This bank account has already been reviewed.' }, { status: 409 })
    const account = await prisma.bankAccount.findUniqueOrThrow({ where: { id: BigInt(id) }, include: adminBankAccountInclude })
    const response = NextResponse.json({ data: serializeAdminBankAccount(account) })
    if (admin.refreshedSession) setSessionCookies(response, admin.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to review payout account', error)
    return NextResponse.json({ error: 'Unable to review payout account.' }, { status: 500 })
  }
}
