import type { QueryParams } from '@/lib/buildParams'
import type { RenterBookingStatus } from '@/types/booking'

export interface AdminUser {
  id: number
  displayName: string
  fullName: string | null
  email: string
  phone: string | null
  profileImageUrl: string | null
  phoneVerified: boolean
  emailVerified: boolean
  idVerified: boolean
  listings: number
  bookings: number
  joinedAt: string
  status: 'active' | 'suspended'
  activeListings: Array<{
    id: number
    name: string
    imageUrl: string | null
    pricePerDay: number
  }>
  recentBookings: Array<{
    id: number
    bookingNo: string
    productName: string
    total: number
    status: RenterBookingStatus
    createdAt: string
  }>
}

export interface AdminUserQuery extends QueryParams {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'suspended' | ''
  verification?: 'verified' | 'unverified' | ''
}

export interface AdminUserList {
  items: AdminUser[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
