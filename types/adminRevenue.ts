export type RevenuePeriod = 'today' | 'this-week' | 'this-month' | 'last-month'

export interface AdminRevenueRow {
  period: string
  transactions: number
  grossVolume: number
  rentalAmount: number
  platformFees: number
  ownerReceivables: number
  depositReturns: number
}

export interface AdminRevenueData {
  rows: AdminRevenueRow[]
  stats: {
    grossVolume: number
    platformFees: number
    ownerReceivables: number
    depositReturns: number
    completedBookings: number
  }
}
