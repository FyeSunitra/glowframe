'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, Check, MoreHorizontal, Users, X } from 'lucide-react'

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
import { adminUserService } from '@/services/adminUsers'
import { useAppStore } from '@/store/appStore'
import type { AdminUser } from '@/types/adminUser'

function VerifiedChips({
  user,
  labels,
}: {
  user: AdminUser
  labels: readonly [string, string, string]
}) {
  const chips = [
    { label: labels[0], verified: user.phoneVerified },
    { label: labels[1], verified: user.emailVerified },
    { label: labels[2], verified: user.idVerified },
  ]

  return (
    <span className="flex flex-wrap gap-1">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            chip.verified
              ? 'bg-[#DFF2E0] text-gf-green'
              : 'bg-gf-pink-100 text-gf-muted',
          )}
        >
          {chip.verified ? <Check size={11} /> : <X size={11} />}
          {chip.label}
        </span>
      ))}
    </span>
  )
}

function UserAvatar({
  user,
  size = 36,
}: {
  user: Pick<AdminUser, 'displayName' | 'profileImageUrl'>
  size?: number
}) {
  const initials = user.displayName
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gf-brown-800 font-[var(--font-poppins)] font-bold text-gf-pink-100',
        size > 40 ? 'text-xl' : 'text-[13px]',
      )}
      style={{ width: size, height: size }}
    >
      {user.profileImageUrl ? (
        <Image
          src={user.profileImageUrl}
          alt={user.displayName}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        initials
      )}
    </span>
  )
}

export default function UsersPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminUsers')
  const bookingText = getPageText(locale, 'myRentals')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    '' | 'active' | 'suspended'
  >('')
  const [verificationFilter, setVerificationFilter] = useState<
    '' | 'verified' | 'unverified'
  >('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)

  const filters = {
    search,
    status: statusFilter,
    verification: verificationFilter,
    page,
    limit,
  }
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminUserService.list(filters).then(unwrapApiResponse),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, suspended }: { id: number; suspended: boolean }) =>
      adminUserService.setSuspended(id, suspended).then(unwrapApiResponse),
    onSuccess: (updated) => {
      setSelected(updated)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      showToast(
        updated.status === 'suspended'
          ? t.suspendedToast
          : t.unsuspendedToast,
      )
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : t.updateFailed)
    },
  })

  const users = data?.items ?? []
  const verificationLabels = [t.phoneChip, t.emailChip, t.idChip] as const
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )
  const statusOptions = [
    { value: '', label: t.allStatuses },
    { value: 'active', label: t.active },
    { value: 'suspended', label: t.suspended },
  ]
  const verificationOptions = [
    { value: '', label: t.allVerification },
    { value: 'verified', label: t.fullyVerified },
    { value: 'unverified', label: t.notFullyVerified },
  ]

  function resetPage(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  function openUser(user: AdminUser) {
    setSelected(user)
    setDrawerOpen(true)
  }

  const columns = [
    {
      key: 'user',
      header: t.user,
      render: (user: AdminUser) => (
        <span className="flex min-w-[210px] items-center gap-2.5">
          <UserAvatar user={user} />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold">
              {user.displayName}
            </span>
            <span className="block truncate text-xs text-gf-muted">
              {user.email}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'verified',
      header: t.verified,
      render: (user: AdminUser) => (
        <VerifiedChips user={user} labels={verificationLabels} />
      ),
    },
    { key: 'listings', header: t.listings },
    { key: 'bookings', header: t.bookings },
    {
      key: 'joinedAt',
      header: t.joined,
      render: (user: AdminUser) => (
        <span className="whitespace-nowrap text-[12.5px] text-gf-muted">
          {dateFormatter.format(new Date(user.joinedAt))}
        </span>
      ),
    },
    {
      key: 'status',
      header: t.status,
      render: (user: AdminUser) => <StatusBadge status={user.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (user: AdminUser) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t.view}
            onClick={(event) => event.stopPropagation()}
            className="cursor-pointer rounded-[8px] border-0 bg-transparent p-2 text-gf-brown-700"
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => openUser(user)}>
              {t.view}
            </DropdownMenuItem>
            {user.status === 'active' ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setSelected(user)
                  setSuspendOpen(true)
                }}
              >
                {t.suspend}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() =>
                  statusMutation.mutate({ id: user.id, suspended: false })
                }
              >
                {t.unsuspend}
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
            value: statusFilter,
            onChange: (value) => {
              if (value === '' || value === 'active' || value === 'suspended') {
                setStatusFilter(value)
                setPage(1)
              }
            },
            options: statusOptions,
          },
          {
            label: t.verification,
            value: verificationFilter,
            onChange: (value) => {
              if (
                value === '' ||
                value === 'verified' ||
                value === 'unverified'
              ) {
                setVerificationFilter(value)
                setPage(1)
              }
            },
            options: verificationOptions,
          },
        ]}
      />

      {isError ? (
        <EmptyState icon={Users} heading={t.loadFailed} sub={t.noUsersSub} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            loading={isLoading}
            onRowClick={openUser}
            empty={
              <EmptyState
                icon={Users}
                heading={t.noUsers}
                sub={t.noUsersSub}
              />
            }
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
        title={selected?.displayName ?? ''}
        subtitle={selected?.email}
        footer={
          selected?.status === 'active' ? (
            <button
              type="button"
              className="w-full cursor-pointer rounded-full border-0 bg-gf-red px-5 py-3 text-sm font-semibold text-white"
              onClick={() => {
                setDrawerOpen(false)
                setSuspendOpen(true)
              }}
            >
              {t.suspendAccount}
            </button>
          ) : selected ? (
            <button
              type="button"
              disabled={statusMutation.isPending}
              className="w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-5 py-3 text-sm font-semibold text-gf-brown-900 disabled:opacity-50"
              onClick={() =>
                statusMutation.mutate({ id: selected.id, suspended: false })
              }
            >
              {t.unsuspend}
            </button>
          ) : undefined
        }
      >
        {selected && (
          <div>
            <div className="mb-5 flex justify-center">
              <UserAvatar user={selected} size={64} />
            </div>
            <div className="mb-5 flex justify-center">
              <VerifiedChips
                user={selected}
                labels={verificationLabels}
              />
            </div>

            <DetailRow
              label={t.fullName}
              value={selected.fullName || t.notProvided}
            />
            <DetailRow label={t.email} value={selected.email} />
            <DetailRow label={t.phone} value={selected.phone || t.notProvided} />
            <DetailRow
              label={t.joined}
              value={dateFormatter.format(new Date(selected.joinedAt))}
            />

            <Separator className="my-5" />
            <SectionTitle>{t.activeListings}</SectionTitle>
            {selected.activeListings.length ? (
              selected.activeListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center gap-2.5 border-b border-gf-line py-2.5"
                >
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-[6px] bg-gf-pink-100">
                    {listing.imageUrl ? (
                      <Image
                        src={listing.imageUrl}
                        alt={listing.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <Camera
                        size={18}
                        className="absolute inset-0 m-auto text-gf-brown-300"
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {listing.name}
                  </span>
                  <span className="whitespace-nowrap text-xs text-gf-muted">
                    {money(listing.pricePerDay)} THB/{t.perDay}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gf-muted">{t.noActiveListings}</p>
            )}

            <SectionTitle className="mt-5">{t.recentBookings}</SectionTitle>
            {selected.recentBookings.length ? (
              selected.recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="border-b border-gf-line py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-gf-brown-900">
                        {booking.productName}
                      </div>
                      <div className="mt-1 text-xs text-gf-muted">
                        {booking.bookingNo} · {dateFormatter.format(new Date(booking.createdAt))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[13px] font-semibold text-gf-brown-900">
                        {money(booking.total)} THB
                      </div>
                      <div className="mt-1 text-xs text-gf-muted">
                        {bookingText.statuses[booking.status]}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gf-muted">{t.noRecentBookings}</p>
            )}
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={t.suspendTitle}
        description={t.suspendDescription}
        destructive
        onConfirm={() => {
          if (selected) {
            statusMutation.mutate({ id: selected.id, suspended: true })
          }
          setSuspendOpen(false)
        }}
      />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gf-line py-2.5 text-[13px]">
      <span className="shrink-0 text-gf-muted">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-gf-brown-800">
        {value}
      </span>
    </div>
  )
}

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3
      className={cn(
        'mb-2.5 mt-0 text-sm font-semibold text-gf-brown-900',
        className,
      )}
    >
      {children}
    </h3>
  )
}
