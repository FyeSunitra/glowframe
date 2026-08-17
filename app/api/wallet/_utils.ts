export const bankAccountInclude = {
  bank: { select: { id: true, code: true, abbreviation: true, name: true, logoUrl: true } },
} as const

export function serializeBankAccount(account: {
  id: bigint
  accountName: string
  accountNumberMasked: string
  isDefault: boolean
  verifiedByAdmin: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected'
  verificationReason: string | null
  verifiedAt: Date | null
  createdAt: Date
  bank: { id: bigint; code: string; abbreviation: string; name: string; logoUrl: string | null } | null
}) {
  if (!account.bank) throw new Error('Bank account does not reference a bank record.')
  return {
    id: Number(account.id),
    bank: { ...account.bank, id: Number(account.bank.id) },
    accountName: account.accountName,
    accountNumberMasked: account.accountNumberMasked,
    isDefault: account.isDefault,
    verifiedByAdmin: account.verifiedByAdmin,
    verificationStatus: account.verificationStatus,
    verificationReason: account.verificationReason,
    verifiedAt: account.verifiedAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
  }
}

export function normalizeAccountNumber(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.replace(/[^0-9]/g, '')
  return /^\d{6,20}$/.test(normalized) ? normalized : null
}

export function maskAccountNumber(value: string) {
  return `${'*'.repeat(Math.max(4, Math.min(8, value.length - 4)))}${value.slice(-4)}`
}
