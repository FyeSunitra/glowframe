export const payoutInclude = {
  user: { select: { displayName: true, email: true } },
  bankAccount: {
    select: {
      id: true,
      bankName: true,
      accountName: true,
      accountNumberMasked: true,
      verificationStatus: true,
      bank: { select: { abbreviation: true } },
    },
  },
} as const

export function serializePayout(item: {
  id: bigint
  amount: { toString(): string }
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  rejectionReason: string | null
  createdAt: Date
  reviewedAt: Date | null
  transferProofFileName: string | null
  transferReference: string | null
  transferNote: string | null
  transferredAt: Date | null
  user: { displayName: string; email: string }
  bankAccount: {
    id: bigint
    bankName: string
    accountName: string
    accountNumberMasked: string
    verificationStatus: 'pending' | 'approved' | 'rejected'
    bank: { abbreviation: string } | null
  }
}, transferProofUrl: string | null = null) {
  return {
    id: Number(item.id), user: item.user, amount: Number(item.amount), status: item.status,
    bankAccount: {
      id: Number(item.bankAccount.id),
      bankName: item.bankAccount.bankName,
      abbreviation: item.bankAccount.bank?.abbreviation ?? item.bankAccount.bankName,
      accountName: item.bankAccount.accountName,
      accountNumberMasked: item.bankAccount.accountNumberMasked,
      verificationStatus: item.bankAccount.verificationStatus,
    },
    rejectionReason: item.rejectionReason,
    requestedAt: item.createdAt.toISOString(),
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    transferProofFileName: item.transferProofFileName,
    transferProofUrl,
    transferReference: item.transferReference,
    transferNote: item.transferNote,
    transferredAt: item.transferredAt?.toISOString() ?? null,
  }
}
