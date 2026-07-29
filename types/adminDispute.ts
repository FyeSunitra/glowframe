import type { QueryParams } from '@/lib/buildParams'

export type DamageDecision =
  | 'no_damage'
  | 'partial_damage'
  | 'full_damage'

export interface AdminDispute {
  id: number
  bookingId: number
  bookingNo: string
  status: 'pending' | 'resolved'
  product: {
    name: string
    imageUrl: string | null
  }
  renter: {
    displayName: string
    email: string
  }
  owner: {
    displayName: string
    email: string
  }
  rentalFee: number
  deposit: number
  claimedAmount: number
  approvedAmount: number | null
  damageDescription: string
  damageEvidenceUrl: string
  deliveryEvidenceUrl: string | null
  returnEvidenceUrl: string | null
  renterReason: string | null
  decision: DamageDecision | null
  decisionNote: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

export interface AdminDisputeQuery extends QueryParams {
  page?: number
  limit?: number
  search?: string
  status?: 'pending' | 'resolved'
}

export interface AdminDisputeList {
  items: AdminDispute[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ResolveDamagePayload {
  decision: DamageDecision
  approvedAmount?: number
  note: string
}
