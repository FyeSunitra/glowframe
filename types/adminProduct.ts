import type { QueryParams } from '@/lib/buildParams'

export interface AdminProductAccessory {
  id: string
  name: string
  quantity: number
  custom: boolean
}

export interface AdminProduct {
  id: number
  name: string
  desc: string
  price: number
  deposit: number
  color: string
  rating: number
  bookingCount: number
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'hidden' | 'archived'
  createdAt: string
  categoryName: string
  brandName: string
  model: string
  serialNumber: string | null
  conditionNote: string | null
  extraDetails: string | null
  rejectionReason: string | null
  pickupAddress: string
  accessories: AdminProductAccessory[]
  media: Array<{
    id: number
    mediaType: 'image' | 'video'
    url: string
    publicId: string | null
  }>
  owner: {
    id: number
    displayName: string
    email: string
  }
}

export interface AdminProductQuery extends QueryParams {
  search?: string
  status?: string
  price?: string
}

export interface UpdateAdminProductPayload {
  name?: string
  desc?: string
  extra?: string
  price?: number
  deposit?: number
  action?: 'approve' | 'reject' | 'archive'
  reason?: string
}
