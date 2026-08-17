import type { QueryParams } from '@/lib/buildParams'

export type WalletTransactionType =
  | 'payment'
  | 'rentalIncome'
  | 'depositReturn'
  | 'refund'
  | 'damageDeduction'
  | 'withdrawal'
  | 'adminAdjustment'

export interface WalletTransactionItem {
  id: string
  type: WalletTransactionType
  direction: 'incoming' | 'outgoing'
  amount: number
  status: string
  bookingNo: string | null
  productName: string | null
  description: string | null
  createdAt: string
}

export interface WalletSummary {
  balance: number
  pendingWithdrawal: number
  availableBalance: number
  transactions: WalletTransactionItem[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface WalletQuery extends QueryParams {
  page?: number
  limit?: number
  direction?: 'incoming' | 'outgoing' | ''
}

export interface UserBankAccount {
  id: number
  bank: { id: number; code: string; abbreviation: string; name: string; logoUrl: string | null }
  accountName: string
  accountNumberMasked: string
  isDefault: boolean
  verifiedByAdmin: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected'
  verificationReason: string | null
  verifiedAt: string | null
  createdAt: string
}

export interface SaveBankAccountPayload {
  bankId: number
  accountName: string
  accountNumber?: string
  isDefault?: boolean
}

export interface WithdrawalRequest {
  id: number
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  bankAccount: UserBankAccount
  rejectionReason: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface CreateWithdrawalPayload {
  bankAccountId: number
  amount: number
}
