import type { QueryParams } from '@/lib/buildParams'
import type {
  RenterBookingStatus,
  RenterPaymentStatus,
} from '@/types/booking'

export interface AdminBooking {
  id: number
  bookingNo: string
  camera: { id: number; name: string; color: string; imageUrl: string | null }
  renter: { displayName: string; email: string }
  owner: { displayName: string; email: string }
  days: number
  delivery: 'pickup' | 'messenger' | 'shipping'
  rentalFee: number
  deliveryFee: number
  deposit: number
  total: number
  startDate: string
  endDate: string
  status: RenterBookingStatus
  payment: {
    attemptNo: number
    status: RenterPaymentStatus
    method: 'promptpay' | 'bank_transfer'
    proofFileName: string | null
    submittedAt: string | null
    rejectionReason: string | null
  } | null
  pickupAddress: string | null
  recipientName: string | null
  recipientPhone: string | null
  deliveryAddress: string | null
  deliveryNote: string | null
  cancellationReason: string | null
  deliveryDetails: {
    method: 'pickup' | 'messenger' | 'shipping'
    providerName: string | null
    trackingNumber: string | null
    shippedAt: string | null
    readyForPickupAt: string | null
    renterReceivedAt: string | null
  } | null
  returnDetails: {
    status: string
    method: 'pickup' | 'messenger' | 'shipping' | null
    providerName: string | null
    trackingNumber: string | null
    note: string | null
    evidenceUrl: string | null
    renterReturnedAt: string | null
    ownerReceivedAt: string | null
    damageDescription: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export interface AdminBookingQuery extends QueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  delivery?: string
}

export interface AdminBookingList {
  items: AdminBooking[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
