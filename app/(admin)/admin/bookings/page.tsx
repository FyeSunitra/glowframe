'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, Camera, MoreHorizontal } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DataTable } from '@/components/admin/shared/DataTable'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { Pagination } from '@/components/common/Pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn, money } from '@/lib/utils'
import { adminBookingService } from '@/services/adminBookings'
import { useAppStore } from '@/store/appStore'
import type { AdminBooking } from '@/types/adminBooking'

export default function BookingsPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminBookings')
  const bookingText = getPageText(locale, 'myRentals')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [delivery, setDelivery] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<AdminBooking | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const filters = { search, status, delivery, page, limit }
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'bookings', filters],
    queryFn: () => adminBookingService.list(filters).then(unwrapApiResponse),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: number) =>
      adminBookingService.cancel(id).then(unwrapApiResponse),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      setDrawerOpen(false)
      showToast(t.bookingCancelled)
    },
    onError: (error) => showToast(
      error instanceof Error ? error.message : t.loadFailed,
    ),
  })

  const statusOptions = [
    { value: '', label: t.allStatuses },
    ...Object.entries(bookingText.statuses).map(([value, label]) => ({
      value,
      label,
    })),
  ]
  const deliveryOptions = [
    { value: '', label: t.allDelivery },
    { value: 'pickup', label: t.pickup },
    { value: 'messenger', label: t.grab },
    { value: 'shipping', label: t.post },
  ]
  const rows = data?.items ?? []

  function resetPage(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  const columns = [
    {
      key: 'bookingNo',
      header: t.bookingNo,
      render: (row: AdminBooking) => (
        <span className="font-[var(--font-poppins)] text-[13px] font-semibold">
          {row.bookingNo}
        </span>
      ),
    },
    {
      key: 'camera',
      header: t.camera,
      render: (row: AdminBooking) => (
        <span className="flex items-center gap-2">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-[6px] bg-gf-pink-100">
            {row.camera.imageUrl ? (
              <Image
                src={row.camera.imageUrl}
                alt={row.camera.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <Camera className="absolute inset-0 m-auto text-gf-brown-300" size={19} />
            )}
          </span>
          <span className="text-[13px]">{row.camera.name}</span>
        </span>
      ),
    },
    { key: 'renter', header: t.renter, render: (row: AdminBooking) => row.renter.displayName },
    { key: 'owner', header: t.owner, render: (row: AdminBooking) => row.owner.displayName },
    { key: 'days', header: t.days, render: (row: AdminBooking) => row.days },
    {
      key: 'delivery',
      header: t.delivery,
      render: (row: AdminBooking) => bookingText.deliveryMethods[row.delivery],
    },
    { key: 'total', header: t.total, render: (row: AdminBooking) => `${money(row.total)} THB` },
    {
      key: 'status',
      header: t.status,
      render: (row: AdminBooking) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row: AdminBooking) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t.view}
            onClick={(event) => event.stopPropagation()}
            className="cursor-pointer rounded-[8px] border-0 bg-transparent p-2 text-gf-brown-700"
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => {
              setSelected(row)
              setDrawerOpen(true)
            }}>
              {t.view}
            </DropdownMenuItem>
            {canCancel(row.status) && (
              <DropdownMenuItem variant="destructive" onClick={() => {
                setSelected(row)
                setCancelOpen(true)
              }}>
                {t.cancel}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
      <FilterBar
        search={{
          placeholder: t.search,
          value: search,
          onChange: (value) => resetPage(setSearch, value),
        }}
        selects={[
          {
            label: t.status,
            value: status,
            onChange: (value) => resetPage(setStatus, value),
            options: statusOptions,
          },
          {
            label: t.delivery,
            value: delivery,
            onChange: (value) => resetPage(setDelivery, value),
            options: deliveryOptions,
          },
        ]}
      />

      {isError ? (
        <EmptyState icon={CalendarCheck} heading={t.loadFailed} sub={t.noBookingsSub} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            loading={isLoading}
            onRowClick={(row) => {
              setSelected(row)
              setDrawerOpen(true)
            }}
            empty={<EmptyState icon={CalendarCheck} heading={t.noBookings} sub={t.noBookingsSub} />}
          />
          {data && data.meta.total > 0 && (
            <Pagination
              {...data.meta}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value)
                setPage(1)
              }}
            />
          )}
        </>
      )}

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selected ? `${t.bookingNo} ${selected.bookingNo}` : ''}
        subtitle={selected ? bookingText.statuses[selected.status] : undefined}
        footer={selected && canCancel(selected.status) ? (
          <button
            type="button"
            className="w-full cursor-pointer rounded-full border-0 bg-gf-red px-5 py-3 font-semibold text-white"
            onClick={() => {
              setDrawerOpen(false)
              setCancelOpen(true)
            }}
          >
            {t.cancelBooking}
          </button>
        ) : undefined}
      >
        {selected && (
          <div>
            <div className="mb-5 flex gap-4">
              <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-[8px] bg-gf-pink-100">
                {selected.camera.imageUrl ? (
                  <Image
                    src={selected.camera.imageUrl}
                    alt={selected.camera.name}
                    fill
                    priority
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <Camera className="absolute inset-0 m-auto text-gf-brown-300" size={30} />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gf-brown-900">{selected.camera.name}</div>
                <div className="mt-2"><StatusBadge status={selected.status} /></div>
                <div className="mt-2 text-xs text-gf-muted">{selected.bookingNo}</div>
              </div>
            </div>
            <BookingFlow status={selected.status} labels={bookingText} />
            <SectionTitle>{t.bookingDetails}</SectionTitle>
            <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
              <Party label={t.renter} name={selected.renter.displayName} email={selected.renter.email} />
              <Party label={t.owner} name={selected.owner.displayName} email={selected.owner.email} />
            </div>
            <Separator className="my-5" />
            <DetailRow label={t.dates} value={`${selected.startDate} - ${selected.endDate}`} />
            <DetailRow label={t.delivery} value={bookingText.deliveryMethods[selected.delivery]} />
            <DetailRow label={t.rentalFee} value={`${money(selected.rentalFee)} THB`} />
            <DetailRow label={t.deliveryFee} value={`${money(selected.deliveryFee)} THB`} />
            <DetailRow label={bookingText.deposit} value={`${money(selected.deposit)} THB`} />
            <DetailRow label={t.total} value={`${money(selected.total)} THB`} strong />
            <DetailRow label={t.createdAt} value={formatDateTime(selected.createdAt, locale)} />
            <DetailRow label={t.updatedAt} value={formatDateTime(selected.updatedAt, locale)} />

            <SectionTitle>{t.paymentDetails}</SectionTitle>
            {selected.payment ? (
              <>
                <DetailRow label={t.payment} value={bookingText.paymentStatuses[selected.payment.status]} />
                <DetailRow label={t.paymentAttempt} value={String(selected.payment.attemptNo)} />
                <DetailRow
                  label={t.submittedAt}
                  value={selected.payment.submittedAt
                    ? formatDateTime(selected.payment.submittedAt, locale)
                    : t.noData}
                />
                {selected.payment.rejectionReason && (
                  <DetailRow label={bookingText.paymentRejected} value={selected.payment.rejectionReason} />
                )}
              </>
            ) : (
              <p className="text-sm text-gf-muted">{t.noData}</p>
            )}

            <SectionTitle>{t.deliveryDetails}</SectionTitle>
            <DetailRow label={t.pickupAddress} value={selected.pickupAddress ?? t.noData} />
            {selected.recipientName && <DetailRow label={t.recipient} value={selected.recipientName} />}
            {selected.recipientPhone && <DetailRow label={t.recipientPhone} value={selected.recipientPhone} />}
            {selected.deliveryAddress && <DetailRow label={t.deliveryAddress} value={selected.deliveryAddress} />}
            {selected.deliveryDetails ? (
              <>
                <DetailRow
                  label={bookingText.shippingMethodLabel}
                  value={bookingText.deliveryMethods[selected.deliveryDetails.method]}
                />
                <DetailRow label={t.provider} value={selected.deliveryDetails.providerName ?? t.noData} />
                <DetailRow label={t.trackingNumber} value={selected.deliveryDetails.trackingNumber ?? t.noData} />
              </>
            ) : (
              <p className="text-sm text-gf-muted">{t.noData}</p>
            )}

            <SectionTitle>{t.returnDetails}</SectionTitle>
            {selected.returnDetails ? (
              <>
                <DetailRow label={t.returnStatus} value={selected.returnDetails.status} />
                {selected.returnDetails.method && (
                  <DetailRow
                    label={t.returnMethod}
                    value={bookingText.deliveryMethods[selected.returnDetails.method]}
                  />
                )}
                {selected.returnDetails.providerName && (
                  <DetailRow label={t.provider} value={selected.returnDetails.providerName} />
                )}
                <DetailRow label={t.trackingNumber} value={selected.returnDetails.trackingNumber ?? t.noData} />
                {selected.returnDetails.note && (
                  <DetailRow label={t.returnNote} value={selected.returnDetails.note} />
                )}
                {selected.returnDetails.evidenceUrl && (
                  <div className="mt-4">
                    <div className="mb-2 text-xs text-gf-muted">{t.returnEvidence}</div>
                    <a
                      href={selected.returnDetails.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="relative block aspect-video w-full max-w-md overflow-hidden rounded-[8px] border border-gf-line bg-white"
                    >
                      <Image
                        src={selected.returnDetails.evidenceUrl}
                        alt={t.returnEvidence}
                        fill
                        sizes="(max-width: 640px) 100vw, 420px"
                        className="object-cover"
                      />
                    </a>
                  </div>
                )}
                {selected.returnDetails.damageDescription && (
                  <DetailRow label={t.damageDescription} value={selected.returnDetails.damageDescription} />
                )}
              </>
            ) : (
              <p className="text-sm text-gf-muted">{t.noData}</p>
            )}
            {selected.cancellationReason && (
              <>
                <SectionTitle>{t.cancellationReason}</SectionTitle>
                <p className="rounded-[8px] bg-[#FAE0DA] p-4 text-sm text-gf-red">
                  {selected.cancellationReason}
                </p>
              </>
            )}
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t.cancelTitle}
        description={t.cancelDescription}
        destructive
        onConfirm={() => {
          if (selected) cancelMutation.mutate(selected.id)
          setCancelOpen(false)
        }}
      />
    </div>
  )
}

function BookingFlow({
  status,
  labels,
}: {
  status: AdminBooking['status']
  labels: ReturnType<typeof getPageText<'myRentals'>>
}) {
  const steps = [
    labels.timeline.requested,
    labels.timeline.paymentApproved,
    labels.timeline.preparing,
    labels.timeline.handover,
    labels.timeline.renting,
    labels.timeline.returning,
    labels.timeline.completed,
  ]
  const progress: Record<AdminBooking['status'], number> = {
    pendingPayment: 0,
    pendingPaymentReview: 0,
    paymentRejected: 0,
    paymentApproved: 1,
    preparing: 2,
    readyForPickup: 3,
    shipped: 3,
    active: 4,
    returnPending: 5,
    completed: 6,
    cancelled: 0,
    expired: 0,
    deliveryIssue: 3,
    disputed: 5,
  }
  return (
    <div className="mb-6 grid grid-cols-7 gap-1">
      {steps.map((step, index) => (
        <div key={step} className="min-w-0 text-center">
          <div className={cn(
            'mx-auto mb-1.5 size-3 rounded-full',
            index <= progress[status] ? 'bg-gf-green' : 'bg-gf-line',
          )} />
          <div className="text-[9.5px] leading-tight text-gf-muted">{step}</div>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-6 text-sm font-bold text-gf-brown-900">
      {children}
    </h3>
  )
}

function formatDateTime(value: string, locale: 'th' | 'en') {
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function canCancel(status: AdminBooking['status']) {
  return !['completed', 'cancelled', 'expired'].includes(status)
}

function Party({ label, name, email }: { label: string; name: string; email: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase text-gf-muted">{label}</div>
      <div className="text-sm font-semibold text-gf-brown-900">{name}</div>
      <div className="text-[12.5px] text-gf-muted">{email}</div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-gf-line py-2.5 text-[13px]">
      <span className="text-gf-muted">{label}</span>
      <span className={cn('text-right text-gf-brown-900', strong && 'font-bold')}>
        {value}
      </span>
    </div>
  )
}
