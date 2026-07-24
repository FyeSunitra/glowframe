'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { DollarSign, Clock, TrendingUp, MoreHorizontal, Wallet } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { StatCard } from '@/components/admin/shared/StatCard'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { PillTabs } from '@/components/admin/shared/PillTabs'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { WalletHero } from '@/components/features/wallet/WalletHero'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn, money } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

interface AdminPayout {
  id: number
  owner: { displayName: string; email: string }
  bookingNo: string
  bookingTotal: number
  platformFee: number
  payoutAmount: number
  bank: string
  accountNo: string
  requestedAt: string
  status: string
}

interface PayoutsResponse {
  data: AdminPayout[]
  stats: { totalPaid: number; pendingCount: number; thisMonth: number }
}

const rejectPayoutSchema = z.object({ reason: z.string().min(1, 'Reason is required') })
type RejectPayoutForm = z.infer<typeof rejectPayoutSchema>

function OwnerCell({ owner }: { owner: { displayName: string; email: string } }) {
  const initials = owner.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span className="flex items-center gap-[10px]">
      <div className="w-[32px] h-[32px] rounded-full bg-gf-brown-800 text-gf-pink-100 flex items-center justify-center font-bold text-[12px] shrink-0">
        {initials}
      </div>
      <span>
        <div className="font-semibold text-[13px]">{owner.displayName}</div>
        <div className="text-[12px] text-gf-muted">{owner.email}</div>
      </span>
    </span>
  )
}

export default function PayoutsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('Pending Requests')
  const [selected, setSelected] = useState<AdminPayout | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const tab = activeTab === 'Payout History' ? 'history' : 'pending'
  const TABS = ['Pending Requests', 'Payout History']

  const { data: response, isLoading } = useQuery<PayoutsResponse>({
    queryKey: ['admin', 'payouts', tab],
    queryFn: () => axios.get('/api/admin/payouts', { params: { tab } }).then(r => r.data),
  })

  const payouts = response?.data ?? []
  const stats = response?.stats ?? { totalPaid: 0, pendingCount: 0, thisMonth: 0 }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] })

  const approveMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/payouts/${id}`, { action: 'approve' }),
    onSuccess: () => { invalidate(); showToast('Payout approved') },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      axios.patch(`/api/admin/payouts/${id}`, { action: 'reject', reason }),
    onSuccess: () => { invalidate(); showToast('Payout rejected') },
  })

  const rejectForm = useForm<RejectPayoutForm>({ resolver: zodResolver(rejectPayoutSchema) })

  const SHARED_COLS = [
    { key: 'owner', header: 'Owner', render: (row: AdminPayout) => <OwnerCell owner={row.owner} /> },
    { key: 'bookingNo', header: 'Booking #', render: (row: AdminPayout) => row.bookingNo },
    { key: 'bookingTotal', header: 'Booking total', render: (row: AdminPayout) => `${money(row.bookingTotal)} THB` },
    { key: 'platformFee', header: 'Platform fee', render: (row: AdminPayout) => `${money(row.platformFee)} THB` },
    { key: 'payout', header: 'Payout amount', render: (row: AdminPayout) => <span className="font-bold">{money(row.payoutAmount)} THB</span> },
    { key: 'bank', header: 'Bank/account', render: (row: AdminPayout) => `${row.bank} ${row.accountNo}` },
    { key: 'requested', header: 'Requested', render: (row: AdminPayout) => <span className="text-[12.5px] text-gf-muted">{row.requestedAt}</span> },
    { key: 'status', header: 'Status', render: (row: AdminPayout) => <StatusBadge status={row.status} /> },
  ]

  const PENDING_COLS = [
    ...SHARED_COLS,
    { key: 'actions', header: '', render: (row: AdminPayout) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(row); setDrawerOpen(true) }}>View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(row); setApproveOpen(true) }}>Approve</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => { setSelected(row); rejectForm.reset(); setRejectOpen(true) }}>Reject</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Payouts']} title="Payouts" />

      <div className="mb-[22px] grid grid-cols-3 gap-[22px] max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        <StatCard icon={DollarSign} label="Total Paid Out" value={isLoading ? '' : `${money(stats.totalPaid)} THB`} />
        <StatCard icon={Clock} label="Pending Requests" value={isLoading ? '' : stats.pendingCount} />
        <StatCard icon={TrendingUp} label="This Month Paid" value={isLoading ? '' : `${money(stats.thisMonth)} THB`} />
      </div>

      <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />

      <DataTable
        columns={activeTab === 'Pending Requests' ? PENDING_COLS : SHARED_COLS}
        data={payouts}
        loading={isLoading}
        empty={<EmptyState icon={Wallet} heading={activeTab === 'Pending Requests' ? 'No pending requests' : 'No payout history'} sub="Payout requests appear here when owners request withdrawals." />}
      />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected?.owner.displayName ?? ''} subtitle={`Booking #${selected?.bookingNo}`}>
        {selected && (
          <div>
            <WalletHero balance={selected.payoutAmount} onWithdraw={() => {}} />
            <div className="[margin-top:20px]">
              {[
                { label: 'Owner', value: selected.owner.displayName },
                { label: 'Email', value: selected.owner.email },
                { label: 'Booking #', value: selected.bookingNo },
                { label: 'Booking total', value: `${money(selected.bookingTotal)} THB` },
                { label: 'Platform fee', value: `${money(selected.platformFee)} THB` },
                { label: 'Payout amount', value: `${money(selected.payoutAmount)} THB`, bold: true },
                { label: 'Bank', value: selected.bank },
                { label: 'Account', value: selected.accountNo },
                { label: 'Requested', value: selected.requestedAt },
              ].map(r => (
                <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                  <span className="text-gf-muted">{r.label}</span>
                  <span className={cn(r.bold ? 'font-bold' : 'font-medium')}>{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between [padding:10px_0] text-[13px]">
                <span className="text-gf-muted">Status</span>
                <StatusBadge status={selected.status} />
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve this payout?"
        description={`${money(selected?.payoutAmount ?? 0)} THB will be marked as paid to ${selected?.owner.displayName}.`}
        onConfirm={() => { if (selected) approveMutation.mutate(selected.id); setApproveOpen(false) }}
      />

      <FormDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Payout Request"
        submitLabel="Reject"
        onSubmit={rejectForm.handleSubmit((data) => {
          if (selected) rejectMutation.mutate({ id: selected.id, reason: data.reason })
          setRejectOpen(false)
        })}
      >
        <form>
          <Label>Reason for rejection</Label>
          <Textarea {...rejectForm.register('reason')} placeholder="Explain why this payout is being rejected…" className="[margin-top:6px]" />
          {rejectForm.formState.errors.reason && (
            <span className="text-[12px] text-gf-red [margin-top:4px] block">
              {rejectForm.formState.errors.reason.message}
            </span>
          )}
        </form>
      </FormDialog>
    </div>
  )
}
