export const adminBankAccountInclude = {
  user: { select: { displayName: true, fullName: true, email: true } },
  bank: { select: { name: true, abbreviation: true } },
} as const

export function serializeAdminBankAccount(item: {
  id: bigint
  accountName: string
  accountNumberMasked: string
  verificationStatus: 'pending' | 'approved' | 'rejected'
  verificationReason: string | null
  verifiedAt: Date | null
  createdAt: Date
  user: { displayName: string; fullName: string | null; email: string }
  bank: { name: string; abbreviation: string } | null
}) {
  return {
    id: Number(item.id), user: item.user,
    bank: { name: item.bank?.name ?? '', abbreviation: item.bank?.abbreviation ?? '' },
    accountName: item.accountName, accountNumberMasked: item.accountNumberMasked,
    status: item.verificationStatus, rejectionReason: item.verificationReason,
    verifiedAt: item.verifiedAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString(),
  }
}
