'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { RefreshCw, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { PillTabs } from '@/components/admin/shared/PillTabs'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { money } from '@/lib/utils'
import { useMenuI18n } from '@/hooks/useMenuI18n'
import { useToast } from '@/hooks/useToast'

interface Refund { id: number; refundId: string; txnId: string; user: string; bookingNo: string; requested: number; approved: number | null; reason: string; requestedDate: string; status: string }

const TABS = ['Pending', 'Approved', 'Rejected']
const METHOD_OPTIONS = [{ value: '', label: 'All methods' }, { value: 'qr', label: 'Thai QR' }, { value: 'card', label: 'VISA/Mastercard' }]

const partialSchema = z.object({ amount: z.number().min(1), reason: z.string().min(1) })
const rejectSchema = z.object({ reason: z.string().min(1) })
type PartialForm = z.infer<typeof partialSchema>
type RejectForm = z.infer<typeof rejectSchema>

export default function RefundsPage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('Pending')
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [selected, setSelected] = useState<Refund | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [partialOpen, setPartialOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const tab = activeTab.toLowerCase()
  const filters = { search, method: methodFilter, tab }
  const { data: refunds = [], isLoading } = useQuery<Refund[]>({
    queryKey: ['admin', 'financial', 'refunds', filters],
    queryFn: () => axios.get('/api/admin/financial/refunds', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'financial', 'refunds'] })
  const approveMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/financial/refunds/${id}`, { action: 'approve-full' }), onSuccess: () => { invalidate(); showToast(tr('Full refund approved')) } })
  const rejectMutation = useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => axios.patch(`/api/admin/financial/refunds/${id}`, { action: 'reject', reason }), onSuccess: () => { invalidate(); showToast(tr('Refund rejected')) } })

  const partialForm = useForm<PartialForm>({ resolver: zodResolver(partialSchema), defaultValues: { amount: 0 } })
  const rejectForm = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) })

  const COLUMNS = [
    { key: 'refundId', header: 'Refund ID', render: (r: Refund) => <span className="font-[var(--font-poppins)] font-semibold text-[12px]">{r.refundId}</span> },
    { key: 'txnId', header: 'Transaction ID', render: (r: Refund) => <span className="text-[12px]">{r.txnId}</span> },
    { key: 'user', header: 'User', render: (r: Refund) => r.user },
    { key: 'bookingNo', header: 'Booking #', render: (r: Refund) => r.bookingNo },
    { key: 'requested', header: 'Requested', render: (r: Refund) => `${money(r.requested)} THB` },
    { key: 'approved', header: 'Approved', render: (r: Refund) => r.approved ? `${money(r.approved)} THB` : '—' },
    { key: 'reason', header: 'Reason', render: (r: Refund) => <span className="text-[12.5px] text-gf-muted">{r.reason.slice(0, 50)}{r.reason.length > 50 ? '…' : ''}</span> },
    { key: 'requestedDate', header: 'Requested date', render: (r: Refund) => <span className="text-[12.5px] text-gf-muted">{r.requestedDate}</span> },
    { key: 'status', header: 'Status', render: (r: Refund) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: Refund) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>{tr('View')}</DropdownMenuItem>
          {r.status === 'pending' && <>
            <DropdownMenuItem onClick={() => { setSelected(r); setApproveOpen(true) }}>{tr('Approve full refund')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setSelected(r); partialForm.reset({ amount: 0 }); setPartialOpen(true) }}>{tr('Approve partial refund')}</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => { setSelected(r); rejectForm.reset(); setRejectOpen(true) }}>{tr('Reject')}</DropdownMenuItem>
          </>}
          {r.status === 'approved' && <DropdownMenuItem onClick={() => showToast(tr('Marked as gateway confirmed'))}>{tr('Mark gateway confirmed')}</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Financial', 'Refunds']} title="Refunds" />
      <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />
      <FilterBar
        search={{ placeholder: 'Search refund or booking…', value: search, onChange: setSearch }}
        selects={[{ label: 'Method', value: methodFilter, onChange: setMethodFilter, options: METHOD_OPTIONS }]}
      />
      <DataTable columns={COLUMNS} data={refunds} loading={isLoading} empty={<EmptyState icon={RefreshCw} heading="No refund requests" sub="Refund requests appear here when raised." />} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected?.refundId ?? ''} subtitle={selected?.status}>
        {selected && (
          <div>
            {[
              { label: 'Transaction ID', value: selected.txnId },
              { label: 'User', value: selected.user },
              { label: 'Booking #', value: selected.bookingNo },
              { label: 'Requested amount', value: `${money(selected.requested)} THB` },
              { label: 'Approved amount', value: selected.approved ? `${money(selected.approved)} THB` : '—' },
              { label: 'Requested date', value: selected.requestedDate },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{tr(r.label)}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:16px] [padding:16px] bg-gf-pink-100 rounded-[14px] text-[13px] [line-height:1.6]">{selected.reason}</div>
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog open={approveOpen} onOpenChange={setApproveOpen} title="Approve full refund?" description={`${money(selected?.requested ?? 0)} THB will be refunded to the customer.`} onConfirm={() => { if (selected) approveMutation.mutate(selected.id); setApproveOpen(false) }} />
      <FormDialog open={partialOpen} onOpenChange={setPartialOpen} title="Approve Partial Refund" submitLabel="Approve" onSubmit={partialForm.handleSubmit(() => { showToast(tr('Partial refund approved')); setPartialOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div><Label>Approved amount (THB)</Label><Input type="number" {...partialForm.register('amount', { valueAsNumber: true })} className="[margin-top:6px]" /></div>
          <div><Label>Reason</Label><Textarea {...partialForm.register('reason')} className="[margin-top:6px]" /></div>
        </form>
      </FormDialog>
      <FormDialog open={rejectOpen} onOpenChange={setRejectOpen} title="Reject Refund" submitLabel="Reject" onSubmit={rejectForm.handleSubmit(data => { if (selected) rejectMutation.mutate({ id: selected.id, reason: data.reason }); setRejectOpen(false) })}>
        <form><Label>Reason</Label><Textarea {...rejectForm.register('reason')} className="[margin-top:6px]" /></form>
      </FormDialog>
    </div>
  )
}
