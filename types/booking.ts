export type RenterBookingStatus =
  | 'pendingPayment'
  | 'pendingPaymentReview'
  | 'paymentRejected'
  | 'paymentApproved'
  | 'preparing'
  | 'readyForPickup'
  | 'shipped'
  | 'active'
  | 'returnPending'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'deliveryIssue'
  | 'disputed'

export type RenterPaymentStatus =
  | 'pendingEvidence'
  | 'pendingReview'
  | 'approved'
  | 'rejected'
  | 'refunded'

export type BookingViewRole = 'renter' | 'owner'

export interface RenterBooking {
  id: number
  bookingNo: string
  status: RenterBookingStatus
  viewerRole: BookingViewRole
  product: {
    id: number
    name: string
    imageUrl: string | null
  }
  owner: {
    displayName: string
    phone: string | null
  }
  renter: {
    displayName: string
    phone: string | null
  }
  startDate: string
  endDate: string
  rentalDays: number
  deliveryMethod: 'pickup' | 'messenger' | 'shipping'
  rentalFee: number
  deliveryFee: number
  deposit: number
  total: number
  payment: {
    id: number
    attemptNo: number
    status: RenterPaymentStatus
    proofFileName: string | null
    submittedAt: string | null
    rejectionReason: string | null
    account: {
      id: number
      method: 'promptpay' | 'bank_transfer'
      bankName: string
      bankAbbreviation: string
      accountName: string
      accountNumber: string
    } | null
  } | null
  delivery: {
    method: 'pickup' | 'messenger' | 'shipping'
    providerName: string | null
    trackingNumber: string | null
    shippedAt: string | null
    readyForPickupAt: string | null
    renterReceivedAt: string | null
    evidenceUrl: string | null
    note: string | null
  } | null
  return: {
    status: string
    method: 'pickup' | 'messenger' | 'shipping' | null
    providerName: string | null
    trackingNumber: string | null
    note: string | null
    evidenceUrl: string | null
    renterReturnedAt: string | null
    ownerReceivedAt: string | null
    damageDescription: string | null
    damageEvidenceUrl: string | null
    damageAmount: number
    approvedDamageAmount: number | null
    adminDecision: 'no_damage' | 'partial_damage' | 'full_damage' | null
    adminDecisionNote: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export interface RenterBookingListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface RenterBookingList {
  items: RenterBooking[]
  meta: RenterBookingListMeta
}

export interface CreateBookingPayload {
  productId: number
  paymentAccountId: number
  startDate: string
  endDate: string
  deliveryMethod: 'pickup' | 'grab' | 'post'
  proofFile: File
}

export type OwnerBookingActionPayload =
  | { action: 'start_preparing' }
  | { action: 'ready_for_pickup' }
  | {
      action: 'mark_shipped'
      shippingMethod: 'messenger' | 'shipping'
      providerName: string
      trackingNumber: string
      note?: string
      evidenceUrl: string
      evidencePublicId: string
    }
  | { action: 'confirm_return' }
  | {
      action: 'report_damage'
      description: string
      damageAmount: number
      evidenceUrl: string
      evidencePublicId: string
    }

export type RenterBookingActionPayload =
  | { action: 'confirm_received' }
  | {
      action: 'request_return'
      returnMethod: 'pickup' | 'messenger' | 'shipping'
      providerName?: string
      trackingNumber?: string
      note?: string
      evidenceUrl: string
      evidencePublicId: string
    }

export type BookingEvidenceKind = 'delivery' | 'return' | 'damage'

export interface BookingEvidenceUpload {
  url: string
  publicId: string
}
