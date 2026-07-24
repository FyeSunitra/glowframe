'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { PieChart, Users, TrendingUp, Clock } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { StatCard } from '@/components/admin/shared/StatCard'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { money } from '@/lib/utils'

const PERIOD_OPTIONS = [{ value: 'monthly', label: 'Monthly' }, { value: 'weekly', label: 'Weekly' }]
const LOOKBACK_OPTIONS = [{ value: '3-months', label: 'Last 3 months' }, { value: '6-months', label: 'Last 6 months' }, { value: '12-months', label: 'Last 12 months' }]

interface CohortStats { conversionRate30d: number; ownerFirstRentalTime: number; repeatRentalRate: number; monthlyActiveRenters: number }
interface CohortRow { cohort: string; w1: number | null; w2: number | null; w3: number | null; w4: number | null; m2: number | null; m3: number | null }
interface FunnelRow { stage: string; count: number; pct: number }
interface RepeatRow { range: string; renters: number; pct: number }
interface CohortResponse { stats: CohortStats; cohortTable: CohortRow[]; activationFunnel: FunnelRow[]; repeatRate: RepeatRow[] }

function cellColor(val: number | null): string {
  if (val === null) return 'transparent'
  if (val === 0) return 'var(--gf-line)'
  if (val <= 20) return 'var(--gf-pink-300)'
  if (val <= 50) return 'var(--gf-pink-500)'
  if (val <= 80) return 'var(--gf-brown-300)'
  return 'var(--gf-brown-800)'
}
function cellTextColor(val: number | null): string {
  if (val !== null && val > 80) return 'var(--gf-pink-100)'
  return 'var(--gf-brown-900)'
}

export default function CohortPage() {
  const [period, setPeriod] = useState('monthly')
  const [lookback, setLookback] = useState('6-months')

  const { data, isLoading } = useQuery<CohortResponse>({
    queryKey: ['admin', 'analytics', 'cohort', period, lookback],
    queryFn: () => axios.get('/api/admin/analytics/cohort', { params: { period, lookback } }).then(r => r.data.data),
  })

  const stats = data?.stats
  const cohortRows = data?.cohortTable ?? []

  const COHORT_COLS = [
    { key: 'cohort', header: 'Cohort', render: (r: CohortRow) => <span className="font-semibold text-[13px]">{r.cohort}</span> },
    ...(['w1', 'w2', 'w3', 'w4', 'm2', 'm3'] as const).map(k => ({
      key: k,
      header: k === 'm2' ? 'Month 2' : k === 'm3' ? 'Month 3' : `Week ${k[1]}`,
      render: (r: CohortRow) => {
        const val = r[k]
        return (
          <div className="min-w-[46px] rounded-md px-2.5 py-1 text-center text-[13px] font-semibold" style={{ background: cellColor(val), color: cellTextColor(val) }}>
            {val !== null ? `${val}%` : '—'}
          </div>
        )
      },
    })),
  ]

  const FUNNEL_COLS = [
    { key: 'stage', header: 'Stage', render: (r: FunnelRow) => r.stage },
    { key: 'count', header: 'Count', render: (r: FunnelRow) => <span className="font-semibold">{r.count.toLocaleString()}</span> },
    { key: 'pct', header: 'Conversion', render: (r: FunnelRow) => (
      <div>
        <span className="font-semibold">{r.pct}%</span>
        <div className="bg-gf-line rounded-full h-[6px] [margin-top:4px]">
          <div className="h-1.5 rounded-full bg-gf-brown-800" style={{ width: `${r.pct}%` }} />
        </div>
      </div>
    )},
  ]

  const REPEAT_COLS = [
    { key: 'range', header: 'Bookings made', render: (r: RepeatRow) => r.range },
    { key: 'renters', header: 'Renters', render: (r: RepeatRow) => r.renters.toLocaleString() },
    { key: 'pct', header: '% of all renters', render: (r: RepeatRow) => (
      <div>
        <span className="font-semibold">{r.pct}%</span>
        <div className="bg-gf-line rounded-full h-[6px] [margin-top:4px]">
          <div className="h-1.5 rounded-full bg-gf-brown-800" style={{ width: `${r.pct}%` }} />
        </div>
      </div>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Analytics', 'Cohort & Retention']}
        title="Cohort & Retention"
        action={<button className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">Export CSV</button>}
      />
      <FilterBar selects={[
        { label: 'Period', value: period, onChange: setPeriod, options: PERIOD_OPTIONS },
        { label: 'Lookback', value: lookback, onChange: setLookback, options: LOOKBACK_OPTIONS },
      ]} />

      <div className="grid [grid-template-columns:repeat(4,1fr)] gap-[22px] [margin-bottom:22px]">
        <StatCard icon={TrendingUp} label="30-day booking conversion" value={isLoading ? '' : `${stats?.conversionRate30d}%`} />
        <StatCard icon={Clock} label="Owner first-rental time" value={isLoading ? '' : `${stats?.ownerFirstRentalTime} days`} />
        <StatCard icon={PieChart} label="Repeat rental rate" value={isLoading ? '' : `${stats?.repeatRentalRate}%`} />
        <StatCard icon={Users} label="Monthly active renters" value={isLoading ? '' : stats?.monthlyActiveRenters ?? ''} />
      </div>

      <div className="mb-[22px] rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)]">
        <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">Signup-to-booking cohort</div>
        {cohortRows.length === 0 && !isLoading ? (
          <EmptyState icon={PieChart} heading="Not enough data yet" sub="Cohort data appears after the first full month of signups." />
        ) : (
          <DataTable columns={COHORT_COLS} data={cohortRows} loading={isLoading} />
        )}
      </div>

      <div className="grid [grid-template-columns:1fr_1fr] gap-[22px]">
        <div className="rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)]">
          <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">Owner activation funnel</div>
          <DataTable columns={FUNNEL_COLS} data={data?.activationFunnel ?? []} loading={isLoading} />
        </div>
        <div className="rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)]">
          <div className="text-[15px] font-semibold text-gf-brown-900 [margin-bottom:16px]">Repeat rental rate</div>
          <DataTable columns={REPEAT_COLS} data={data?.repeatRate ?? []} loading={isLoading} />
        </div>
      </div>
    </div>
  )
}
