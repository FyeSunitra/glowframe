import type { QueryParams } from '@/lib/buildParams'

export interface AdminPayout {
  id: number
  user: { displayName: string; email: string }
  amount: number
  bankAccount: { id: number; bankName: string; abbreviation: string; accountName: string; accountNumberMasked: string; verificationStatus: 'pending' | 'approved' | 'rejected' }
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  rejectionReason: string | null
  requestedAt: string
  reviewedAt: string | null
  transferProofFileName: string | null
  transferProofUrl: string | null
  transferReference: string | null
  transferNote: string | null
  transferredAt: string | null
}

export interface AdminPayoutList {
  items: AdminPayout[]
  stats: { totalPaid: number; pendingCount: number; thisMonth: number }
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface AdminPayoutQuery extends QueryParams {
  page?: number
  limit?: number
  tab?: 'pending' | 'history'
  search?: string
  status?: string
}

export type ReviewPayoutPayload =
  | { action: 'approve'; proof: File; reference?: string; note?: string }
  | { action: 'reject'; reason: string }

export interface AdminBankAccount {
  id: number
  user: { displayName: string; fullName: string | null; email: string }
  bank: { name: string; abbreviation: string }
  accountName: string
  accountNumberMasked: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
  verifiedAt: string | null
  createdAt: string
}

export interface AdminBankAccountList {
  items: AdminBankAccount[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}
