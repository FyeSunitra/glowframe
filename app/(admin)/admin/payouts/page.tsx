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
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

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

type RejectPayoutForm = { reason: string }

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
  const t = getPageText(useAppStore((s) => s.locale), 'adminPayouts')
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [selected, setSelected] = useState<AdminPayout | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const tabs = [t.pendingRequests, t.history]
  const activeTabLabel = tab === 'pending' ? t.pendingRequests : t.history

  const { data: response, isLoading } = useQuery<PayoutsResponse>({
    queryKey: ['admin', 'payouts', tab],
    queryFn: () => axios.get('/api/admin/payouts', { params: { tab } }).then(r => r.data),
  })

  const payouts = response?.data ?? []
  const stats = response?.stats ?? { totalPaid: 0, pendingCount: 0, thisMonth: 0 }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] })

  const approveMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/payouts/${id}`, { action: 'approve' }),
    onSuccess: () => { invalidate(); showToast(t.approvedToast) },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      axios.patch(`/api/admin/payouts/${id}`, { action: 'reject', reason }),
    onSuccess: () => { invalidate(); showToast(t.rejectedToast) },
  })

  const rejectPayoutSchema = z.object({ reason: z.string().trim().min(1, t.reasonRequired) })
  const rejectForm = useForm<RejectPayoutForm>({ resolver: zodResolver(rejectPayoutSchema) })

  const SHARED_COLS = [
    { key: 'owner', header: t.owner, render: (row: AdminPayout) => <OwnerCell owner={row.owner} /> },
    { key: 'bookingNo', header: t.bookingNo, render: (row: AdminPayout) => row.bookingNo },
    { key: 'bookingTotal', header: t.bookingTotal, render: (row: AdminPayout) => `${money(row.bookingTotal)} THB` },
    { key: 'platformFee', header: t.platformFee, render: (row: AdminPayout) => `${money(row.platformFee)} THB` },
    { key: 'payout', header: t.payoutAmount, render: (row: AdminPayout) => <span className="font-bold">{money(row.payoutAmount)} THB</span> },
    { key: 'bank', header: t.bankAccount, render: (row: AdminPayout) => `${row.bank} ${row.accountNo}` },
    { key: 'requested', header: t.requested, render: (row: AdminPayout) => <span className="text-[12.5px] text-gf-muted">{row.requestedAt}</span> },
    { key: 'status', header: t.status, render: (row: AdminPayout) => <StatusBadge status={row.status} /> },
  ]

  const PENDING_COLS = [
    ...SHARED_COLS,
    { key: 'actions', header: '', render: (row: AdminPayout) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(row); setDrawerOpen(true) }}>{t.view}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(row); setApproveOpen(true) }}>{t.approve}</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => { setSelected(row); rejectForm.reset(); setRejectOpen(true) }}>{t.reject}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />

      <div className="mb-[22px] grid grid-cols-3 gap-[22px] max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        <StatCard icon={DollarSign} label={t.totalPaid} value={isLoading ? '' : `${money(stats.totalPaid)} THB`} />
        <StatCard icon={Clock} label={t.pendingRequests} value={isLoading ? '' : stats.pendingCount} />
        <StatCard icon={TrendingUp} label={t.thisMonth} value={isLoading ? '' : `${money(stats.thisMonth)} THB`} />
      </div>

      <PillTabs
        items={tabs}
        value={activeTabLabel}
        onChange={(value) => setTab(value === t.history ? 'history' : 'pending')}
      />

      <DataTable
        columns={tab === 'pending' ? PENDING_COLS : SHARED_COLS}
        data={payouts}
        loading={isLoading}
        empty={<EmptyState icon={Wallet} heading={tab === 'pending' ? t.noPending : t.noHistory} sub={t.emptySub} />}
      />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected?.owner.displayName ?? ''} subtitle={`${t.bookingNo} ${selected?.bookingNo}`}>
        {selected && (
          <div>
            <WalletHero balance={selected.payoutAmount} onWithdraw={() => {}} />
            <div className="[margin-top:20px]">
              {[
                { label: t.owner, value: selected.owner.displayName },
                { label: t.email, value: selected.owner.email },
                { label: t.bookingNo, value: selected.bookingNo },
                { label: t.bookingTotal, value: `${money(selected.bookingTotal)} THB` },
                { label: t.platformFee, value: `${money(selected.platformFee)} THB` },
                { label: t.payoutAmount, value: `${money(selected.payoutAmount)} THB`, bold: true },
                { label: t.bank, value: selected.bank },
                { label: t.account, value: selected.accountNo },
                { label: t.requested, value: selected.requestedAt },
              ].map(r => (
                <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                  <span className="text-gf-muted">{r.label}</span>
                  <span className={cn(r.bold ? 'font-bold' : 'font-medium')}>{r.value}</span>
                </div>
              ))}
              <div className="flex justify-between [padding:10px_0] text-[13px]">
                <span className="text-gf-muted">{t.status}</span>
                <StatusBadge status={selected.status} />
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title={t.approveTitle}
        description={`${t.approveDescriptionPrefix} ${money(selected?.payoutAmount ?? 0)} THB ${t.approveDescriptionSuffix} ${selected?.owner.displayName}.`}
        onConfirm={() => { if (selected) approveMutation.mutate(selected.id); setApproveOpen(false) }}
      />

      <FormDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t.rejectTitle}
        submitLabel={t.reject}
        onSubmit={rejectForm.handleSubmit((data) => {
          if (selected) rejectMutation.mutate({ id: selected.id, reason: data.reason })
          setRejectOpen(false)
        })}
      >
        <form>
          <Label>{t.reason}</Label>
          <Textarea {...rejectForm.register('reason')} placeholder={t.reasonPlaceholder} className="[margin-top:6px]" />
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
