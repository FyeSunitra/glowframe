'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { TrendingUp, BarChart2, Camera, Users } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { StatCard } from '@/components/admin/shared/StatCard'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { CameraGlyph } from '@/components/common/CameraGlyph'
import { cn, money } from '@/lib/utils'
import { useMenuI18n } from '@/hooks/useMenuI18n'

const PERIOD_OPTIONS = [{ value: 'this-week', label: 'This week' }, { value: 'this-month', label: 'This month' }, { value: 'last-month', label: 'Last month' }, { value: 'last-3-months', label: 'Last 3 months' }]

interface DemandStats { avgUtilisation: number; avgDaysPerBooking: number; zeroBookingListings: number; avgTimeToFirstBooking: number }
interface TopCamera { rank: number; name: string; color: string; owner: string; bookings: number; revenue: number; utilisation: number }
interface TopOwner { rank: number; owner: string; listings: number; bookings: number; grossEarnings: number; platformFees: number }
interface CityRow { city: string; bookings: number; activeListings: number; supplyGap: number }
interface DeliveryRow { method: string; bookings: number; share: number; avgFee: number }
interface DemandResponse { stats: DemandStats; topCameras: TopCamera[]; topOwners: TopOwner[]; demandByCity: CityRow[]; deliveryBreakdown: DeliveryRow[] }

export default function DemandPage() {
  const { tr } = useMenuI18n()
  const [period, setPeriod] = useState('this-month')
  const { data, isLoading } = useQuery<DemandResponse>({
    queryKey: ['admin', 'analytics', 'demand', period],
    queryFn: () => axios.get('/api/admin/analytics/demand', { params: { period } }).then(r => r.data.data),
  })
  const stats = data?.stats
  const TOP_CAM_COLS = [
    { key: 'rank', header: '#', render: (r: TopCamera) => <span className="font-bold text-gf-muted">{r.rank}</span> },
    { key: 'camera', header: 'Camera', render: (r: TopCamera) => <span className="flex items-center gap-[8px]"><CameraGlyph size={24} color={r.color} />{r.name}</span> },
    { key: 'owner', header: 'Owner', render: (r: TopCamera) => r.owner },
    { key: 'bookings', header: 'Bookings', render: (r: TopCamera) => r.bookings },
    { key: 'revenue', header: 'Revenue', render: (r: TopCamera) => `${money(r.revenue)} THB` },
    { key: 'utilisation', header: 'Utilisation', render: (r: TopCamera) => (
      <div className="min-w-[100px]">
        <span className="font-semibold">{r.utilisation}%</span>
        <div className="bg-gf-line rounded-full h-[6px] [margin-top:4px]">
          <div className="h-1.5 rounded-full bg-gf-brown-800" style={{ width: `${r.utilisation}%` }} />
        </div>
      </div>
    )},
  ]

  const TOP_OWN_COLS = [
    { key: 'rank', header: '#', render: (r: TopOwner) => <span className="font-bold text-gf-muted">{r.rank}</span> },
    { key: 'owner', header: 'Owner', render: (r: TopOwner) => r.owner },
    { key: 'listings', header: 'Listings', render: (r: TopOwner) => r.listings },
    { key: 'bookings', header: 'Bookings', render: (r: TopOwner) => r.bookings },
    { key: 'gross', header: 'Gross earnings', render: (r: TopOwner) => `${money(r.grossEarnings)} THB` },
    { key: 'fees', header: 'Platform fees', render: (r: TopOwner) => `${money(r.platformFees)} THB` },
  ]

  const CITY_COLS = [
    { key: 'city', header: 'City', render: (r: CityRow) => <span className="font-semibold">{r.city}</span> },
    { key: 'bookings', header: 'Bookings', render: (r: CityRow) => r.bookings },
    { key: 'activeListings', header: 'Active listings', render: (r: CityRow) => r.activeListings },
    { key: 'supplyGap', header: 'Supply gap', render: (r: CityRow) => (
      <span className={cn('font-bold', r.supplyGap > 0 ? 'text-gf-red' : 'text-gf-green')}>{r.supplyGap > 0 ? `+${r.supplyGap}` : r.supplyGap}</span>
    )},
  ]

  const DELIVERY_COLS = [
    { key: 'method', header: 'Method', render: (r: DeliveryRow) => r.method },
    { key: 'bookings', header: 'Bookings', render: (r: DeliveryRow) => r.bookings },
    { key: 'share', header: 'Share', render: (r: DeliveryRow) => (
      <div className="min-w-[80px]">
        <span className="font-semibold">{r.share}%</span>
        <div className="bg-gf-line rounded-full h-[6px] [margin-top:4px]">
          <div className="h-1.5 rounded-full bg-gf-brown-800" style={{ width: `${r.share}%` }} />
        </div>
      </div>
    )},
    { key: 'avgFee', header: 'Avg fee', render: (r: DeliveryRow) => r.avgFee ? `${money(r.avgFee)} THB` : '—' },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Analytics', 'Rental Demand']}
        title="Rental Demand"
        action={<button className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">{tr('Export CSV')}</button>}
      />
      <FilterBar selects={[{ label: 'Period', value: period, onChange: setPeriod, options: PERIOD_OPTIONS }]} />

      <div className="grid [grid-template-columns:repeat(4,1fr)] gap-[22px] [margin-bottom:22px]">
        <StatCard icon={BarChart2} label="Avg utilisation rate" value={isLoading ? '' : `${stats?.avgUtilisation}%`} />
        <StatCard icon={TrendingUp} label="Avg days per booking" value={isLoading ? '' : stats?.avgDaysPerBooking ?? ''} />
        <StatCard icon={Camera} label="Listings with zero bookings" value={isLoading ? '' : stats?.zeroBookingListings ?? ''} />
        <StatCard icon={Users} label="Avg time to first booking" value={isLoading ? '' : `${stats?.avgTimeToFirstBooking} days`} />
      </div>

      <div className="grid [grid-template-columns:1fr_1fr] gap-[22px] [margin-bottom:22px]">
        <div className="rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)]">
          <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">{tr('Top cameras by bookings')}</div>
          <DataTable columns={TOP_CAM_COLS} data={data?.topCameras ?? []} loading={isLoading} empty={<EmptyState icon={Camera} heading="No data" sub="No demand data available." />} />
        </div>
        <div className="rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)]">
          <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">{tr('Top owners by earnings')}</div>
          <DataTable columns={TOP_OWN_COLS} data={data?.topOwners ?? []} loading={isLoading} empty={<EmptyState icon={Users} heading="No data" sub="No owner data available." />} />
        </div>
      </div>

      <div className="grid [grid-template-columns:1fr_1fr] gap-[22px]">
        <div className="rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)]">
          <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">{tr('Demand by city')}</div>
          <DataTable columns={CITY_COLS} data={data?.demandByCity ?? []} loading={isLoading} empty={<EmptyState icon={TrendingUp} heading="No data" sub="No city data available." />} />
        </div>
        <div className="rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)]">
          <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">{tr('Delivery method breakdown')}</div>
          <DataTable columns={DELIVERY_COLS} data={data?.deliveryBreakdown ?? []} loading={isLoading} empty={<EmptyState icon={BarChart2} heading="No data" sub="No delivery data available." />} />
        </div>
      </div>
    </div>
  )
}
