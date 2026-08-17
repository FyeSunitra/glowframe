import type { QueryParams } from '@/lib/buildParams'
import type { RenterBookingStatus } from '@/types/booking'

export type OperationDirection = 'outbound' | 'return'
export type OperationMethod = 'pickup' | 'messenger' | 'shipping'
export type ReturnOperationStatus =
  | 'active'
  | 'overdue'
  | 'awaitingOwner'
  | 'completed'
  | 'damageReported'
  | 'disputed'

export interface ReturnOperation {
  id: number
  bookingNo: string
  product: { name: string; imageUrl: string | null }
  renter: string
  owner: string
  dueDate: string
  status: ReturnOperationStatus
  bookingStatus: RenterBookingStatus
  method: OperationMethod | null
  providerName: string | null
  trackingNumber: string | null
  note: string | null
  evidenceUrl: string | null
  renterReturnedAt: string | null
  ownerReceivedAt: string | null
  damageDescription: string | null
  damageEvidenceUrl: string | null
}

export interface DeliveryOperation {
  id: string
  bookingId: number
  bookingNo: string
  product: { name: string; imageUrl: string | null }
  renter: string
  owner: string
  direction: OperationDirection
  method: OperationMethod
  providerName: string | null
  trackingNumber: string | null
  note: string | null
  evidenceUrl: string | null
  address: string | null
  status: 'readyForPickup' | 'shipped' | 'received' | 'returnShipped' | 'returnReceived'
  updatedAt: string
  timeline: Array<{
    event: 'readyForPickup' | 'shipped' | 'renterReceived' | 'renterReturned' | 'ownerReceived'
    at: string
  }>
}

export interface OperationList<T> {
  items: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ReturnOperationQuery extends QueryParams {
  page?: number
  limit?: number
  search?: string
  tab?: 'pending' | 'history'
  status?: ReturnOperationStatus | ''
}

export interface DeliveryOperationQuery extends QueryParams {
  page?: number
  limit?: number
  search?: string
  tab?: 'active' | 'delivered'
  direction?: OperationDirection | ''
  method?: OperationMethod | ''
}
