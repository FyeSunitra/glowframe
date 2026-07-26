import type { QueryParams } from '@/lib/buildParams'

export type AdminKycStatus = 'pending' | 'approved' | 'rejected'

export interface AdminKycRequest {
  id: string
  user: {
    displayName: string
    email: string
  }
  legalName: string
  documentType: 'national_id'
  documentUrl: string | null
  submittedAt: string
  retryCount: number
  status: AdminKycStatus
  rejectionReason: string | null
  reviewedAt: string | null
}

export interface AdminKycQuery extends QueryParams {
  search?: string
  status?: AdminKycStatus | ''
}

export type AdminKycReviewPayload =
  | { action: 'approve' }
  | { action: 'reject'; reason: string }
