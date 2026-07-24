'use client'

import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Users, Camera, CalendarCheck, DollarSign } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { StatCard } from '@/components/admin/shared/StatCard'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory'
import { money } from '@/lib/utils'
import type { WalletTransaction } from '@/types'

interface DashboardBooking {
  id: number
  bookingNo: string
  camera: string
  renter: string
  rentalDate: string
  total: number
  status: string
}

interface DashboardData {
  stats: { users: number; listings: number; bookings: number; revenue: number }
  recentBookings: DashboardBooking[]
  recentTransactions: WalletTransaction[]
}

const BOOKING_COLS_MINI = [
  { key: 'bookingNo', header: 'Booking #', render: (row: DashboardBooking) => (
    <span className="font-[var(--font-poppins)] font-semibold text-[13px]">{row.bookingNo}</span>
  )},
  { key: 'camera', header: 'Camera', render: (row: DashboardBooking) => row.camera },
  { key: 'renter', header: 'Renter', render: (row: DashboardBooking) => row.renter },
  { key: 'rentalDate', header: 'Dates', render: (row: DashboardBooking) => (
    <span className="text-[13px] text-gf-muted">{row.rentalDate}</span>
  )},
  { key: 'total', header: 'Total', render: (row: DashboardBooking) => `${money(row.total)} THB` },
  { key: 'status', header: 'Status', render: (row: DashboardBooking) => <StatusBadge status={row.status} /> },
]

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin', 'stats'],
    queryFn: () => axios.get('/api/admin/stats').then(r => r.data.data),
  })

  const stats = data?.stats ?? { users: 0, listings: 0, bookings: 0, revenue: 0 }
  const recentBookings = data?.recentBookings ?? []
  const recentTransactions = data?.recentTransactions ?? []

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Dashboard']} title="Dashboard" />

      <div className="mb-[22px] grid grid-cols-4 gap-[22px] max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        <StatCard icon={Users} label="Total Users" value={isLoading ? '' : stats.users} />
        <StatCard icon={Camera} label="Active Listings" value={isLoading ? '' : stats.listings} />
        <StatCard icon={CalendarCheck} label="Bookings This Month" value={isLoading ? '' : stats.bookings} />
        <StatCard icon={DollarSign} label="Revenue This Month" value={isLoading ? '' : `${money(stats.revenue)} THB`} />
      </div>

      <div className="mb-[22px] grid grid-cols-2 gap-[22px] max-[900px]:grid-cols-1">
        <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
          <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">
            Recent Bookings
          </div>
          <DataTable columns={BOOKING_COLS_MINI} data={recentBookings} loading={isLoading} />
        </div>

        <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
          <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">
            Recent Transactions
          </div>
          <TransactionHistory items={recentTransactions} />
        </div>
      </div>
    </div>
  )
}
