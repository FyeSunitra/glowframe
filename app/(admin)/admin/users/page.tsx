'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Users, MoreHorizontal } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory'
import { CameraGlyph } from '@/components/common/CameraGlyph'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { cn, money } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { WalletTransaction } from '@/types'
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

interface AdminUser {
  id: number
  displayName: string
  fullName: string
  email: string
  phone: string
  phoneVerified: boolean
  emailVerified: boolean
  idVerified: boolean
  listings: number
  bookings: number
  joinedAt: string
  status: string
}

interface UserListing { id: number; name: string; color: string; price: number }

const MOCK_USER_LISTINGS: UserListing[] = [
  { id: 1, name: 'Canon EOS R5', color: '#F3C9D2', price: 900 },
  { id: 2, name: 'Sony A7 IV', color: '#D9E7F2', price: 800 },
]
const MOCK_USER_BOOKINGS: WalletTransaction[] = [
  { id: 1, name: 'Booking #123456-78', date: '12 Jul 2026', amt: 4500, status: 'paid' },
  { id: 2, name: 'Booking #234567-89', date: '10 Jul 2026', amt: 2600, status: 'paid' },
  { id: 3, name: 'Booking #345678-90', date: '8 Jul 2026', amt: 1800, status: 'pending' },
]

function VerifiedChips({ user, labels }: { user: AdminUser; labels: readonly [string, string, string] }) {
  return (
    <span>
      {[{ label: labels[0], verified: user.phoneVerified }, { label: labels[1], verified: user.emailVerified }, { label: labels[2], verified: user.idVerified }].map(c => (
        <span key={c.label} className={cn(
          'mr-1 rounded-full px-[7px] py-0.5 text-[11px] font-semibold',
          c.verified ? 'bg-[#DFF2E0] text-gf-green' : 'bg-gf-pink-100 text-gf-muted',
        )}>
          {c.label} {c.verified ? '✓' : '✗'}
        </span>
      ))}
    </span>
  )
}

function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gf-brown-800 font-[var(--font-poppins)] font-bold text-gf-pink-100',
        size > 40 ? 'text-xl' : 'text-[13px]',
      )}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}

export default function UsersPage() {
  const t = getPageText(useAppStore((s) => s.locale), 'adminUsers')
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [verificationFilter, setVerificationFilter] = useState('')
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)

  const filters = { search, status: statusFilter, verification: verificationFilter }

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users', filters],
    queryFn: () => axios.get('/api/admin/users', { params: filters }).then(r => r.data.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })

  const suspendMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/users/${id}`, { action: 'suspend' }),
    onSuccess: () => { invalidate(); showToast(t.suspendedToast) },
  })
  const unsuspendMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/users/${id}`, { action: 'unsuspend' }),
    onSuccess: () => { invalidate(); showToast(t.unsuspendedToast) },
  })
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
  const verificationLabels = [t.phoneChip, t.emailChip, t.idChip] as const

  const COLUMNS = [
    { key: 'user', header: t.user, render: (row: AdminUser) => (
      <span className="flex items-center gap-[10px] cursor-pointer" onClick={() => { setSelected(row); setDrawerOpen(true) }}>
        <UserAvatar name={row.displayName} />
        <span>
          <div className="font-semibold text-[13px]">{row.displayName}</div>
          <div className="text-[12px] text-gf-muted">{row.email}</div>
        </span>
      </span>
    )},
    { key: 'verified', header: t.verified, render: (row: AdminUser) => <VerifiedChips user={row} labels={verificationLabels} /> },
    { key: 'listings', header: t.listings, render: (row: AdminUser) => row.listings },
    { key: 'bookings', header: t.bookings, render: (row: AdminUser) => row.bookings },
    { key: 'joined', header: t.joined, render: (row: AdminUser) => <span className="text-[12.5px] text-gf-muted">{row.joinedAt}</span> },
    { key: 'status', header: t.status, render: (row: AdminUser) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: '', render: (row: AdminUser) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(row); setDrawerOpen(true) }}>{t.view}</DropdownMenuItem>
          {row.status === 'active'
            ? <DropdownMenuItem variant="destructive" onClick={() => { setSelected(row); setSuspendOpen(true) }}>{t.suspend}</DropdownMenuItem>
            : <DropdownMenuItem onClick={() => unsuspendMutation.mutate(row.id)}>{t.unsuspend}</DropdownMenuItem>
          }
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
      <FilterBar
        search={{ placeholder: t.search, value: search, onChange: setSearch }}
        selects={[
          { label: t.status, value: statusFilter, onChange: setStatusFilter, options: statusOptions },
          { label: t.verification, value: verificationFilter, onChange: setVerificationFilter, options: verificationOptions },
        ]}
      />
      <DataTable
        columns={COLUMNS}
        data={users}
        loading={isLoading}
        empty={<EmptyState icon={Users} heading={t.noUsers} sub={t.noUsersSub} />}
      />

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selected?.displayName ?? ''}
        subtitle={selected?.email}
        footer={selected?.status === 'active' ? (
          <button className="bg-gf-red text-white border-0 rounded-full [padding:11px_22px] font-semibold cursor-pointer w-full"
            onClick={() => { setDrawerOpen(false); setSuspendOpen(true) }}>
            {t.suspendAccount}
          </button>
        ) : undefined}
      >
        {selected && (
          <div>
            <div className="flex justify-center [margin-bottom:20px]">
              <UserAvatar name={selected.displayName} size={60} />
            </div>
            <div className="flex justify-center [margin-bottom:20px] flex-wrap gap-[4px]">
              <VerifiedChips user={selected} labels={verificationLabels} />
            </div>
            {[
              { label: t.fullName, value: selected.fullName },
              { label: t.email, value: selected.email },
              { label: t.phone, value: selected.phone },
              { label: t.joined, value: selected.joinedAt },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
            <Separator className="[margin:20px_0_16px]" />
            <div className="text-[14px] font-semibold text-gf-brown-900 [margin-bottom:12px]">{t.activeListings}</div>
            {MOCK_USER_LISTINGS.map(l => (
              <div key={l.id} className="flex items-center gap-[10px] [padding:8px_0] [border-bottom:1px_solid_var(--gf-line)]">
                <CameraGlyph size={28} color={l.color} />
                <span className="text-[13px] font-medium flex-1">{l.name}</span>
                <span className="text-[12.5px] text-gf-muted">{money(l.price)} THB/{t.perDay}</span>
              </div>
            ))}
            <div className="text-[14px] font-semibold text-gf-brown-900 [margin-top:20px] [margin-bottom:12px]">{t.recentBookings}</div>
            <TransactionHistory items={MOCK_USER_BOOKINGS} />
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title={t.suspendTitle}
        description={t.suspendDescription}
        destructive
        onConfirm={() => { if (selected) suspendMutation.mutate(selected.id); setSuspendOpen(false) }}
      />
    </div>
  )
}
