export type PhotoboothPaymentStatus = 'pending' | 'succeeded' | 'failed' | 'expired' | 'cancelled'

export interface PhotoboothPayment {
  id: number
  frameId: number
  referenceId: string
  amount: number
  currency: 'THB'
  status: PhotoboothPaymentStatus
  expiresAt: string | null
  accessExpiresAt: string | null
  paidAt: string | null
}

export interface PhotoboothQrPayment extends PhotoboothPayment {
  qrImageBase64: string
}

export interface PhotoboothFrameAccess {
  allowed: boolean
  requiresPayment: boolean
  payment?: PhotoboothPayment
}
