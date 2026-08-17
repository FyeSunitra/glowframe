'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import type { ComponentType } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  Camera,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  PackageCheck,
  RefreshCw,
  Scale,
  Users,
} from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn, money } from '@/lib/utils'
import { adminDashboardService } from '@/services/adminDashboard'
import { useAppStore } from '@/store/appStore'
import type { AdminDashboardData } from '@/types/adminDashboard'

type DashboardBooking = AdminDashboardData['recentBookings'][number]
type DashboardPayment = AdminDashboardData['recentPayments'][number]

export default function DashboardPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminDashboard')
  const bookingText = getPageText(locale, 'myRentals')
  const router = useRouter()
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminDashboardService.get().then(unwrapApiResponse),
  })

  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )
  const shortDateFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { day: 'numeric', month: 'short' },
  )

  if (isError) {
    return (
      <div className="animate-fade-up">
        <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
        <EmptyState
          icon={AlertTriangle}
          heading={t.loadFailed}
          sub=""
          action={
            <button
              type="button"
              onClick={() => void refetch()}
              className="cursor-pointer rounded-full border-0 bg-gf-pink-500 px-5 py-2.5 text-sm font-semibold text-gf-brown-900"
            >
              {t.retry}
            </button>
          }
        />
      </div>
    )
  }

  const bookingColumns = [
    {
      key: 'bookingNo',
      header: t.bookingNo,
      render: (booking: DashboardBooking) => (
        <span className="font-[var(--font-poppins)] text-[13px] font-semibold">
          {booking.bookingNo}
        </span>
      ),
    },
    {
      key: 'productName',
      header: t.camera,
      render: (booking: DashboardBooking) => booking.productName,
    },
    {
      key: 'renterName',
      header: t.renter,
      render: (booking: DashboardBooking) => booking.renterName,
    },
    {
      key: 'dates',
      header: t.dates,
      render: (booking: DashboardBooking) => (
        <span className="whitespace-nowrap text-[12.5px] text-gf-muted">
          {shortDateFormatter.format(parseDate(booking.startDate))} -{' '}
          {shortDateFormatter.format(parseDate(booking.endDate))}
        </span>
      ),
    },
    {
      key: 'total',
      header: t.total,
      render: (booking: DashboardBooking) => (
        <span className="whitespace-nowrap">{money(booking.total)} THB</span>
      ),
    },
    {
      key: 'status',
      header: t.status,
      render: (booking: DashboardBooking) => (
        <StatusBadge status={booking.status} />
      ),
    },
  ]

  const paymentColumns = [
    {
      key: 'bookingNo',
      header: t.bookingNo,
      render: (payment: DashboardPayment) => (
        <span className="font-[var(--font-poppins)] text-[13px] font-semibold">
          {payment.bookingNo}
        </span>
      ),
    },
    {
      key: 'payerName',
      header: t.payer,
      render: (payment: DashboardPayment) => payment.payerName,
    },
    {
      key: 'amount',
      header: t.total,
      render: (payment: DashboardPayment) => (
        <span className="whitespace-nowrap">{money(payment.amount)} THB</span>
      ),
    },
    {
      key: 'submittedAt',
      header: t.submittedAt,
      render: (payment: DashboardPayment) => (
        <span className="whitespace-nowrap text-[12.5px] text-gf-muted">
          {dateFormatter.format(new Date(payment.submittedAt))}
        </span>
      ),
    },
    {
      key: 'status',
      header: t.status,
      render: (payment: DashboardPayment) => (
        <StatusBadge status={payment.status} />
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', t.title]}
        title={t.title}
        action={
          <button
            type="button"
            title={t.refresh}
            aria-label={t.refresh}
            disabled={isFetching}
            onClick={() => void refetch()}
            className="flex size-10 cursor-pointer items-center justify-center rounded-[8px] border border-gf-line bg-white text-gf-brown-700 disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw size={17} className={cn(isFetching && 'animate-spin')} />
          </button>
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          href="/admin/users"
          icon={Users}
          label={t.totalUsers}
          value={data?.stats.totalUsers}
          loading={isLoading}
        />
        <MetricCard
          href="/admin/products"
          icon={Camera}
          label={t.activeListings}
          value={data?.stats.approvedListings}
          loading={isLoading}
        />
        <MetricCard
          href="/admin/bookings"
          icon={CalendarCheck}
          label={t.monthlyBookings}
          value={data?.stats.monthlyBookings}
          loading={isLoading}
        />
        <MetricCard
          href="/admin/bookings"
          icon={CircleDollarSign}
          label={t.monthlyBookingValue}
          value={
            data ? `${money(data.stats.monthlyBookingValue)} THB` : undefined
          }
          loading={isLoading}
        />
      </section>

      <section className="mb-6">
        <SectionHeader title={t.actionQueue} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QueueItem
            href="/admin/products"
            icon={ClipboardCheck}
            label={t.pendingProducts}
            count={data?.queues.pendingProducts}
            loading={isLoading}
          />
          <QueueItem
            href="/admin/transactions"
            icon={CreditCard}
            label={t.pendingPayments}
            count={data?.queues.pendingPayments}
            loading={isLoading}
          />
          <QueueItem
            href="/admin/bookings"
            icon={PackageCheck}
            label={t.pendingReturns}
            count={data?.queues.pendingReturns}
            loading={isLoading}
          />
          <QueueItem
            href="/admin/trust/disputes"
            icon={Scale}
            label={t.openDisputes}
            count={data?.queues.openDisputes}
            loading={isLoading}
            urgent={Boolean(data?.queues.openDisputes)}
          />
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
        <div className="min-w-0 rounded-[8px] bg-white p-5 shadow-[var(--gf-shadow-sm)] sm:p-6">
          <SectionHeader title={t.bookingTrend} meta={t.lastSixMonths} />
          <BookingTrendChart
            data={data?.bookingTrend ?? []}
            locale={locale}
            loading={isLoading}
            emptyLabel={t.noChartData}
            bookingLabel={t.monthlyBookings}
            valueLabel={t.bookingValue}
          />
        </div>

        <div className="min-w-0 rounded-[8px] bg-white p-5 shadow-[var(--gf-shadow-sm)] sm:p-6">
          <SectionHeader title={t.statusBreakdown} />
          <StatusBreakdown
            data={data?.bookingStatusBreakdown ?? []}
            labels={bookingText.statuses}
            loading={isLoading}
            emptyLabel={t.noChartData}
          />
        </div>
      </section>

      <section className="mb-6 min-w-0 rounded-[8px] bg-white p-4 shadow-[var(--gf-shadow-sm)] sm:p-6">
        <SectionHeader
          title={t.recentBookings}
          actionHref="/admin/bookings"
          actionLabel={t.viewAll}
        />
        <DataTable
          columns={bookingColumns}
          data={data?.recentBookings ?? []}
          loading={isLoading}
          onRowClick={() => router.push('/admin/bookings')}
          empty={
            <EmptyState
              icon={CalendarCheck}
              heading={t.noChartData}
              sub=""
            />
          }
        />
      </section>

      <section className="min-w-0 rounded-[8px] bg-white p-4 shadow-[var(--gf-shadow-sm)] sm:p-6">
        <SectionHeader
          title={t.recentPayments}
          actionHref="/admin/transactions"
          actionLabel={t.viewAll}
        />
        <DataTable
          columns={paymentColumns}
          data={data?.recentPayments ?? []}
          loading={isLoading}
          onRowClick={() => router.push('/admin/transactions')}
          empty={
            <EmptyState
              icon={CreditCard}
              heading={t.noChartData}
              sub=""
            />
          }
        />
      </section>
    </div>
  )
}

function MetricCard({
  href,
  icon: Icon,
  label,
  value,
  loading,
}: {
  href: string
  icon: ComponentType<{ size?: number }>
  label: string
  value: string | number | undefined
  loading: boolean
}) {
  return (
    <Link
      href={href}
      className="group rounded-[8px] bg-white p-5 shadow-[var(--gf-shadow-sm)] transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-gf-pink-100 text-gf-brown-700">
          <Icon size={18} />
        </div>
        <ArrowUpRight
          size={15}
          className="text-gf-muted transition-colors group-hover:text-gf-brown-800"
        />
      </div>
      <p className="mb-0 mt-3 text-[13px] text-gf-muted">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="mb-0 mt-1 font-[var(--font-poppins)] text-[25px] font-bold text-gf-brown-900">
          {value ?? 0}
        </p>
      )}
    </Link>
  )
}

function QueueItem({
  href,
  icon: Icon,
  label,
  count,
  loading,
  urgent = false,
}: {
  href: string
  icon: ComponentType<{ size?: number }>
  label: string
  count: number | undefined
  loading: boolean
  urgent?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex min-h-20 items-center gap-3 rounded-[8px] border bg-white p-4 transition-colors',
        urgent
          ? 'border-[#E6A79C] hover:bg-[#FFF7F5]'
          : 'border-gf-line hover:bg-gf-pink-100',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          urgent
            ? 'bg-[#FAE0DA] text-gf-red'
            : 'bg-gf-pink-100 text-gf-brown-700',
        )}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0 flex-1 text-[13px] font-semibold text-gf-brown-800">
        {label}
      </span>
      {loading ? (
        <Skeleton className="h-7 w-8" />
      ) : (
        <span
          className={cn(
            'font-[var(--font-poppins)] text-xl font-bold',
            urgent ? 'text-gf-red' : 'text-gf-brown-900',
          )}
        >
          {count ?? 0}
        </span>
      )}
    </Link>
  )
}

function BookingTrendChart({
  data,
  locale,
  loading,
  emptyLabel,
  bookingLabel,
  valueLabel,
}: {
  data: AdminDashboardData['bookingTrend']
  locale: 'th' | 'en'
  loading: boolean
  emptyLabel: string
  bookingLabel: string
  valueLabel: string
}) {
  if (loading) return <Skeleton className="h-[230px] w-full" />
  if (!data.length) {
    return <EmptyChart label={emptyLabel} />
  }

  const maximum = Math.max(...data.map((item) => item.bookings), 1)
  const monthFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { month: 'short' },
  )

  return (
    <div className="flex h-[230px] items-end gap-2 border-b border-gf-line pt-8 sm:gap-4">
      {data.map((item) => {
        const height = item.bookings === 0
          ? 4
          : Math.max(18, (item.bookings / maximum) * 165)
        return (
          <div
            key={item.month}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            title={`${bookingLabel}: ${item.bookings} · ${valueLabel}: ${money(item.value)} THB`}
          >
            <span className="mb-1 text-xs font-semibold text-gf-brown-800">
              {item.bookings}
            </span>
            <div
              className="w-full max-w-14 rounded-t-[6px] bg-gf-pink-500 transition-[height]"
              style={{ height }}
            />
            <span className="mt-2 whitespace-nowrap text-[11px] text-gf-muted">
              {monthFormatter.format(new Date(`${item.month}-01T00:00:00Z`))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function StatusBreakdown({
  data,
  labels,
  loading,
  emptyLabel,
}: {
  data: AdminDashboardData['bookingStatusBreakdown']
  labels: Record<string, string>
  loading: boolean
  emptyLabel: string
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    )
  }
  if (!data.length) return <EmptyChart label={emptyLabel} />

  const total = data.reduce((sum, item) => sum + item.count, 0)
  return (
    <div className="space-y-3.5">
      {data.map((item) => (
        <div key={item.status}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-gf-brown-800">
              {labels[item.status] ?? item.status}
            </span>
            <span className="font-semibold text-gf-brown-900">
              {item.count}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gf-pink-100">
            <div
              className="h-full rounded-full bg-gf-brown-500"
              style={{ width: `${Math.max(3, (item.count / total) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-gf-muted">
      {label}
    </div>
  )
}

function SectionHeader({
  title,
  meta,
  actionHref,
  actionLabel,
}: {
  title: string
  meta?: string
  actionHref?: string
  actionLabel?: string
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="m-0 text-[15px] font-semibold text-gf-brown-900">
          {title}
        </h2>
        {meta && <p className="mb-0 mt-1 text-xs text-gf-muted">{meta}</p>}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="shrink-0 text-xs font-semibold text-gf-brown-800 underline"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}
