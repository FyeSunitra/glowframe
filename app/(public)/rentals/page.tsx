'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarRange,
  Camera,
  ChevronRight,
  Package,
} from 'lucide-react'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { Pagination } from '@/components/common/Pagination'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn, money } from '@/lib/utils'
import { bookingService } from '@/services/bookings'
import { useAppStore } from '@/store/appStore'
import type {
  BookingViewRole,
  RenterBooking,
  RenterBookingStatus,
} from '@/types/booking'

type RentalFilter = 'all' | 'ongoing' | 'completed' | 'cancelled'

export default function MyRentalsPage() {
  const locale = useAppStore((state) => state.locale)
  const userId = useAppStore((state) => state.user.id ?? 0)
  const t = getPageText(locale, 'myRentals')
  const [role, setRole] = useState<BookingViewRole>('renter')
  const [filter, setFilter] = useState<RentalFilter>('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookings', 'mine', userId, { role, filter, page, limit }],
    queryFn: async () => unwrapApiResponse(await bookingService.list({
      role,
      filter,
      page,
      limit,
    })),
  })

  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )

  function changeFilter(next: RentalFilter) {
    setFilter(next)
    setPage(1)
  }

  function changeRole(next: BookingViewRole) {
    setRole(next)
    setFilter('all')
    setPage(1)
  }

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.title]} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 flex items-center gap-2.5 text-[20px] font-bold text-gf-brown-900">
            <CalendarRange size={21} />
            {t.title}
          </h1>
          <p className="mb-0 mt-1.5 text-[13px] text-gf-muted">{t.subtitle}</p>
        </div>
        <Link
          href={role === 'owner' ? '/list-camera' : '/for-rent'}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-gf-brown-300 bg-white px-4 py-2 text-[13px] font-semibold text-gf-brown-800 no-underline"
        >
          {role === 'owner' ? <Package size={16} /> : <Camera size={16} />}
          {role === 'owner' ? t.manageListings : t.rentMore}
        </Link>
      </div>

      <div className="flex overflow-x-auto border-b border-gf-line">
          {([
            ['renter', t.renterView],
            ['owner', t.ownerView],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeRole(key)}
              className={cn(
                'flex min-h-12 shrink-0 cursor-pointer items-center gap-2 border-0 border-b-2 bg-transparent px-5 py-3 text-[14px] font-semibold transition-colors',
                role === key
                  ? 'border-gf-brown-800 text-gf-brown-900'
                  : 'border-transparent text-gf-muted',
              )}
            >
              {key === 'renter' ? <Camera size={17} /> : <Package size={17} />}
              {label}
            </button>
          ))}
      </div>

      <section className="rounded-b-[8px] bg-white p-5 shadow-[var(--gf-shadow)] sm:p-7">
        <div className="mb-5 flex overflow-x-auto border-b border-gf-line">
          {([
            ['all', t.filters.all],
            ['ongoing', t.filters.ongoing],
            ['completed', t.filters.completed],
            ['cancelled', t.filters.cancelled],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeFilter(key)}
              className={cn(
                'shrink-0 cursor-pointer border-0 border-b-2 bg-transparent px-4 py-3 text-[13.5px] font-semibold',
                filter === key
                  ? 'border-gf-brown-800 text-gf-brown-900'
                  : 'border-transparent text-gf-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-gf-muted">{t.loading}</div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-gf-red">{t.loadFailed}</div>
        ) : !data?.items.length ? (
          <div className="py-16 text-center">
            <CalendarRange className="mx-auto mb-3 text-gf-brown-300" size={38} />
            <div className="font-semibold text-gf-brown-900">
              {role === 'owner' ? t.ownerEmpty : t.empty}
            </div>
            <p className="mt-1.5 text-sm text-gf-muted">
              {role === 'owner' ? t.ownerEmptyHint : t.emptyHint}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gf-line">
            {data.items.map((booking, index) => (
              <RentalRow
                key={booking.id}
                booking={booking}
                priority={index === 0}
                formatDate={(value) => dateFormatter.format(parseDate(value))}
                labels={t}
              />
            ))}
          </div>
        )}

        {data && data.meta.total > 0 && (
          <Pagination
            {...data.meta}
            onPageChange={setPage}
            onLimitChange={(nextLimit) => {
              setLimit(nextLimit)
              setPage(1)
            }}
          />
        )}
      </section>
    </div>
  )
}

function RentalRow({
  booking,
  priority,
  formatDate,
  labels,
}: {
  booking: RenterBooking
  priority: boolean
  formatDate: (value: string) => string
  labels: ReturnType<typeof getPageText<'myRentals'>>
}) {
  return (
    <article className="grid grid-cols-[112px_minmax(0,1fr)_auto] items-center gap-4 py-5 max-[680px]:grid-cols-[88px_minmax(0,1fr)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-gf-pink-100">
        {booking.product.imageUrl ? (
          <Image
            src={booking.product.imageUrl}
            alt={booking.product.name}
            fill
            priority={priority}
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <Camera className="absolute inset-0 m-auto text-gf-brown-300" size={30} />
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <h2 className="m-0 truncate text-[15px] font-bold text-gf-brown-900">
            {booking.product.name}
          </h2>
          <BookingStatusBadge
            status={booking.status}
            label={labels.statuses[booking.status]}
          />
        </div>
        <div className="text-[12.5px] text-gf-muted">
          {labels.bookingNo} {booking.bookingNo}
        </div>
        <div className="mt-1 text-[12.5px] text-gf-muted">
          {booking.viewerRole === 'owner'
            ? `${labels.renter}: ${booking.renter.displayName}`
            : `${labels.owner}: ${booking.owner.displayName}`}
        </div>
        <div className="mt-2 text-[13px] text-gf-brown-700">
          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          {' · '}
          {booking.rentalDays} {labels.days}
        </div>
      </div>

      <div className="text-right max-[680px]:col-span-2 max-[680px]:flex max-[680px]:items-center max-[680px]:justify-between">
        <div>
          <div className="text-[12px] text-gf-muted">{labels.total}</div>
          <div className="mt-1 font-bold text-gf-brown-900">
            {money(booking.total)} THB
          </div>
        </div>
        <Link
          href={`/rentals/${booking.id}`}
          className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-gf-brown-800 underline underline-offset-2 max-[680px]:mt-0"
        >
          {labels.viewDetails}
          <ChevronRight size={14} />
        </Link>
      </div>
    </article>
  )
}

export function BookingStatusBadge({
  status,
  label,
}: {
  status: RenterBookingStatus
  label: string
}) {
  const danger = ['paymentRejected', 'cancelled', 'expired', 'deliveryIssue'].includes(status)
  const success = status === 'completed'
  const active = ['paymentApproved', 'active', 'readyForPickup', 'shipped'].includes(status)

  return (
    <span className={cn(
      'inline-block rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
      danger && 'bg-[#FAE0DA] text-gf-red',
      success && 'bg-[#DFF2E0] text-gf-green',
      active && 'bg-[#DFF2E0] text-gf-green',
      !danger && !success && !active && 'bg-[#FEF3CD] text-gf-yellow',
    )}>
      {label}
    </span>
  )
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}
