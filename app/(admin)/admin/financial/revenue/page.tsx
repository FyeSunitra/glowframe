'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BadgeDollarSign, CircleDollarSign, PackageCheck, RotateCcw, WalletCards } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { StatCard } from '@/components/admin/shared/StatCard'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { money } from '@/lib/utils'
import { adminRevenueService } from '@/services/adminRevenue'
import { useAppStore } from '@/store/appStore'
import type { AdminRevenueRow, RevenuePeriod } from '@/types/adminRevenue'

export default function RevenuePage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminRevenue')
  const [period, setPeriod] = useState<RevenuePeriod>('this-month')
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin', 'revenue', period], queryFn: () => adminRevenueService.get(period).then(unwrapApiResponse) })
  const stats = data?.stats ?? { grossVolume: 0, platformFees: 0, ownerReceivables: 0, depositReturns: 0, completedBookings: 0 }
  const date = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium' })
  const columns = [
    { key: 'period', header: t.date, render: (row: AdminRevenueRow) => <span className="whitespace-nowrap font-semibold">{date.format(new Date(`${row.period}T00:00:00Z`))}</span> },
    { key: 'transactions', header: t.transactions },
    { key: 'grossVolume', header: t.grossVolume, render: (row: AdminRevenueRow) => `${money(row.grossVolume)} THB` },
    { key: 'rentalAmount', header: t.rentalAmount, render: (row: AdminRevenueRow) => `${money(row.rentalAmount)} THB` },
    { key: 'platformFees', header: t.platformFees, render: (row: AdminRevenueRow) => <b className="text-gf-green">{money(row.platformFees)} THB</b> },
    { key: 'ownerReceivables', header: t.ownerReceivables, render: (row: AdminRevenueRow) => `${money(row.ownerReceivables)} THB` },
    { key: 'depositReturns', header: t.depositReturns, render: (row: AdminRevenueRow) => `${money(row.depositReturns)} THB` },
  ]
  return <div className="animate-fade-up">
    <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
    <FilterBar selects={[{ label: t.period, value: period, onChange: (value) => setPeriod(value as RevenuePeriod), options: [{ value: 'today', label: t.today }, { value: 'this-week', label: t.thisWeek }, { value: 'this-month', label: t.thisMonth }, { value: 'last-month', label: t.lastMonth }] }]} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard icon={CircleDollarSign} label={t.grossVolume} value={`${money(stats.grossVolume)} THB`} />
      <StatCard icon={BadgeDollarSign} label={t.platformFees} value={`${money(stats.platformFees)} THB`} />
      <StatCard icon={WalletCards} label={t.ownerReceivables} value={`${money(stats.ownerReceivables)} THB`} />
      <StatCard icon={RotateCcw} label={t.depositReturns} value={`${money(stats.depositReturns)} THB`} />
      <StatCard icon={PackageCheck} label={t.completedBookings} value={stats.completedBookings} />
    </div>
    {isError ? <EmptyState icon={CircleDollarSign} heading={t.loadFailed} sub={t.noDataSub} /> : <DataTable columns={columns} data={data?.rows ?? []} loading={isLoading} empty={<EmptyState icon={CircleDollarSign} heading={t.noData} sub={t.noDataSub} />} />}
  </div>
}
