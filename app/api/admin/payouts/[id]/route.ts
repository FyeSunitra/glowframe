import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

import { payoutInclude, serializePayout } from '../_utils'
import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { createSupabaseAuthClient, setSessionCookies } from '@/lib/auth/server'
import { BankAccountVerificationStatus, Prisma, WalletEntryType, WithdrawalStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

const MAX_PROOF_SIZE = 5 * 1024 * 1024
const PROOF_TYPES = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']])

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let uploadedPath: string | null = null
  let storage: ReturnType<typeof createSupabaseAuthClient>['storage'] | null = null
  const bucket = process.env.SUPABASE_PAYOUT_BUCKET ?? process.env.SUPABASE_PAYMENT_BUCKET ?? 'payout-proofs'
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    const { id } = await context.params
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Payout id is invalid.' }, { status: 400 })
    const formData = await request.formData()
    const action = String(formData.get('action') ?? '')
    const approve = action === 'approve'
    const reject = action === 'reject'
    const reason = String(formData.get('reason') ?? '').trim()
    const reference = optionalText(formData.get('reference'), 120)
    const note = optionalText(formData.get('note'), 2000)
    if (!approve && !reject) return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
    if (reject && !reason) return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 })

    const proof = formData.get('proof')
    let proofFileName: string | null = null
    if (approve) {
      if (!(proof instanceof File)) return NextResponse.json({ error: 'Transfer proof is required.' }, { status: 400 })
      const extension = PROOF_TYPES.get(proof.type)
      if (!extension || proof.size === 0 || proof.size > MAX_PROOF_SIZE) return NextResponse.json({ error: 'Transfer proof must be JPG, PNG, or WEBP and no larger than 5 MB.' }, { status: 400 })
      proofFileName = proof.name.slice(0, 255)
      if (!admin.accessToken || !admin.refreshToken) return NextResponse.json({ error: 'Admin session has expired.' }, { status: 401 })
      const supabase = createSupabaseAuthClient()
      const { error: sessionError } = await supabase.auth.setSession({ access_token: admin.accessToken, refresh_token: admin.refreshToken })
      if (sessionError) return NextResponse.json({ error: 'Admin session has expired.' }, { status: 401 })
      storage = supabase.storage
      uploadedPath = `${admin.user.authUserId ?? admin.user.id}/payouts/${id}/${randomUUID()}.${extension}`
      const { error: uploadError } = await storage.from(bucket).upload(uploadedPath, await proof.arrayBuffer(), { contentType: proof.type, upsert: false })
      if (uploadError) {
        console.error('Failed to upload payout proof', uploadError)
        return NextResponse.json({ error: 'Private payout storage is not configured or the upload was denied.' }, { status: 502 })
      }
    }

    let payout
    try {
      payout = await prisma.$transaction(async (transaction) => {
        const withdrawal = await transaction.withdrawal.findUnique({ where: { id: BigInt(id) }, include: { wallet: true, bankAccount: true } })
        if (!withdrawal) throw new PayoutError('Payout was not found.', 404)
        if (withdrawal.status !== WithdrawalStatus.pending) throw new PayoutError('This payout has already been reviewed.', 409)
        if (approve && withdrawal.bankAccount.verificationStatus !== BankAccountVerificationStatus.approved) throw new PayoutError('The bank account has not been approved.', 409)
        if (approve && Number(withdrawal.wallet.simulatedBalance) < Number(withdrawal.amount)) throw new PayoutError('Wallet balance is insufficient.', 409)
        const claimed = await transaction.withdrawal.updateMany({
          where: { id: withdrawal.id, status: WithdrawalStatus.pending },
          data: {
            status: approve ? WithdrawalStatus.approved : WithdrawalStatus.rejected,
            reviewedBy: admin.user.id, reviewedAt: new Date(), rejectionReason: reject ? reason : null,
            ...(approve ? { transferProofStoragePath: uploadedPath, transferProofFileName: proofFileName, transferReference: reference, transferNote: note, transferredAt: new Date() } : {}),
          },
        })
        if (claimed.count !== 1) throw new PayoutError('This payout has already been reviewed.', 409)
        if (approve) {
          await transaction.wallet.update({ where: { id: withdrawal.walletId }, data: { simulatedBalance: { decrement: withdrawal.amount } } })
          await transaction.walletEntry.create({ data: { walletId: withdrawal.walletId, entryType: WalletEntryType.withdrawal, amount: withdrawal.amount.negated(), description: `Withdrawal #${withdrawal.id}` } })
        }
        return transaction.withdrawal.findUniqueOrThrow({ where: { id: withdrawal.id }, include: payoutInclude })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (uploadedPath && storage) await storage.from(bucket).remove([uploadedPath])
      throw error
    }
    const signed = uploadedPath && storage ? await storage.from(bucket).createSignedUrl(uploadedPath, 300) : null
    const response = NextResponse.json({ data: serializePayout(payout, signed?.data?.signedUrl ?? null) })
    if (admin.refreshedSession) setSessionCookies(response, admin.refreshedSession)
    return response
  } catch (error) {
    if (error instanceof PayoutError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Failed to review payout', error)
    return NextResponse.json({ error: 'Unable to review payout.' }, { status: 500 })
  }
}

class PayoutError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

function optionalText(value: FormDataEntryValue | null, max: number) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized ? normalized.slice(0, max) : null
}
