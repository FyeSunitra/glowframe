import type { QueryParams } from '@/lib/buildParams'
import type { RenterPaymentStatus } from '@/types/booking'

export interface AdminTransaction {
  id: number
  txnId: string
  bookingNo: string
  user: { displayName: string; email: string }
  method: 'promptpay' | 'bank_transfer'
  rentalFee: number
  deliveryFee: number
  deposit: number
  total: number
  platformFee: number
  date: string
  status: RenterPaymentStatus
  proofFileName: string | null
  proofUrl: string | null
  rejectionReason: string | null
  reviewedAt: string | null
}

export interface AdminTransactionQuery extends QueryParams {
  page?: number
  limit?: number
  search?: string
  method?: string
  status?: string
}

export interface AdminTransactionList {
  items: AdminTransaction[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ReviewPaymentPayload =
  | { action: 'approve_payment' }
  | { action: 'reject_payment'; reason: string }
