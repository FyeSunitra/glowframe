export type IdentityVerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected'

export interface IdentityVerificationData {
  status: IdentityVerificationStatus
  verified: boolean
  submittedAt: string | null
  rejectionReason: string | null
}
