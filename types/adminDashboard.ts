import type {
  RenterBookingStatus,
  RenterPaymentStatus,
} from '@/types/booking'

export interface AdminDashboardData {
  stats: {
    totalUsers: number
    approvedListings: number
    monthlyBookings: number
    monthlyBookingValue: number
  }
  queues: {
    pendingProducts: number
    pendingPayments: number
    pendingReturns: number
    openDisputes: number
  }
  bookingTrend: Array<{
    month: string
    bookings: number
    value: number
  }>
  bookingStatusBreakdown: Array<{
    status: RenterBookingStatus
    count: number
  }>
  recentBookings: Array<{
    id: number
    bookingNo: string
    productName: string
    renterName: string
    startDate: string
    endDate: string
    total: number
    status: RenterBookingStatus
  }>
  recentPayments: Array<{
    id: number
    bookingNo: string
    payerName: string
    amount: number
    status: RenterPaymentStatus
    submittedAt: string
  }>
}
