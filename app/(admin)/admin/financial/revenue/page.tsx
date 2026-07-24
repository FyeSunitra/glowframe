'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BarChart2, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { StatCard } from '@/components/admin/shared/StatCard'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { money } from '@/lib/utils'

interface RevenueRow { period: string; transactions: number; grossVolume: number; platformFees: number; refunds: number; netRevenue: number }
interface RevenueStats { grossVolume: number; platformFees: number; refunds: number; netRevenue: number }
interface RevenueResponse { data: RevenueRow[]; stats: RevenueStats }

const PERIOD_OPTIONS = [{ value: 'today', label: 'Today' }, { value: 'this-week', label: 'This week' }, { value: 'this-month', label: 'This month' }, { value: 'last-month', label: 'Last month' }]

export default function RevenuePage() {
  const [period, setPeriod] = useState('this-month')

  const { data: response, isLoading } = useQuery<RevenueResponse>({
    queryKey: ['admin', 'financial', 'revenue', period],
    queryFn: () => axios.get('/api/admin/financial/revenue', { params: { period } }).then(r => r.data),
  })

  const rows = response?.data ?? []
  const stats = response?.stats ?? { grossVolume: 0, platformFees: 0, refunds: 0, netRevenue: 0 }
  const maxRevenue = Math.max(...rows.map(r => r.netRevenue), 1)

  const COLUMNS = [
    { key: 'period', header: 'Period', render: (r: RevenueRow) => <span className="font-semibold">{r.period}</span> },
    { key: 'transactions', header: 'Transactions', render: (r: RevenueRow) => r.transactions },
    { key: 'grossVolume', header: 'Gross volume', render: (r: RevenueRow) => `${money(r.grossVolume)} THB` },
    { key: 'platformFees', header: 'Platform fees', render: (r: RevenueRow) => `${money(r.platformFees)} THB` },
    { key: 'refunds', header: 'Refunds', render: (r: RevenueRow) => `${money(r.refunds)} THB` },
    { key: 'netRevenue', header: 'Net revenue', render: (r: RevenueRow) => (
      <div>
        <span className="font-bold">{money(r.netRevenue)} THB</span>
        <div className="bg-gf-pink-300 rounded-full h-[6px] [margin-top:4px] w-full">
          <div className="h-1.5 rounded-full bg-gf-brown-800" style={{ width: `${(r.netRevenue / maxRevenue) * 100}%` }} />
        </div>
      </div>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Financial', 'Revenue']}
        title="Revenue & Reconciliation"
        action={<button className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">Export CSV</button>}
      />
      <FilterBar selects={[{ label: 'Period', value: period, onChange: setPeriod, options: PERIOD_OPTIONS }]} />

      <div className="grid [grid-template-columns:repeat(4,1fr)] gap-[22px] [margin-bottom:22px]">
        <StatCard icon={DollarSign} label="Gross Transaction Volume" value={isLoading ? '' : `${money(stats.grossVolume)} THB`} />
        <StatCard icon={TrendingUp} label="Platform Fees Collected" value={isLoading ? '' : `${money(stats.platformFees)} THB`} />
        <StatCard icon={TrendingDown} label="Refunds Issued" value={isLoading ? '' : `${money(stats.refunds)} THB`} />
        <StatCard icon={BarChart2} label="Net Revenue" value={isLoading ? '' : `${money(stats.netRevenue)} THB`} />
      </div>

      <div className="bg-white rounded-[22px] [box-shadow:var(--gf-shadow)] [padding:28px]">
        <DataTable columns={COLUMNS} data={rows} loading={isLoading} empty={<EmptyState icon={BarChart2} heading="No revenue data for this period" sub="Revenue data will appear once transactions are processed." />} />
      </div>
    </div>
  )
}
