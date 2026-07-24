'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { ShieldCheck, MoreHorizontal } from 'lucide-react'
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'

interface KYCRequest { id: number; user: { displayName: string; email: string }; docType: string; submitted: string; retries: number; status: string }

const STATUS_OPTIONS = [{ value: '', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'expired', label: 'Expired' }]

const rejectSchema = z.object({ reason: z.string().min(1, 'Required'), retryAllowed: z.boolean() })
type RejectForm = z.infer<typeof rejectSchema>

export default function KYCPage() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<KYCRequest | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const filters = { search, status: statusFilter }
  const { data: items = [], isLoading } = useQuery<KYCRequest[]>({
    queryKey: ['admin', 'trust', 'kyc', filters],
    queryFn: () => axios.get('/api/admin/trust/kyc', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'trust', 'kyc'] })
  const approveMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/trust/kyc/${id}`, { action: 'approve' }),
    onSuccess: () => { invalidate(); showToast('Identity verified') },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => axios.patch(`/api/admin/trust/kyc/${id}`, { action: 'reject', reason }),
    onSuccess: () => { invalidate(); showToast('Verification rejected') },
  })
  const rejectForm = useForm<RejectForm>({ resolver: zodResolver(rejectSchema), defaultValues: { retryAllowed: true } })

  const COLUMNS = [
    { key: 'user', header: 'User', render: (r: KYCRequest) => (
      <span className="cursor-pointer" onClick={() => { setSelected(r); setDrawerOpen(true) }}>
        <div className="font-semibold text-[13px]">{r.user.displayName}</div>
        <div className="text-[12px] text-gf-muted">{r.user.email}</div>
      </span>
    )},
    { key: 'docType', header: 'Document type', render: (r: KYCRequest) => r.docType },
    { key: 'submitted', header: 'Submitted', render: (r: KYCRequest) => <span className="text-[12.5px] text-gf-muted">{r.submitted}</span> },
    { key: 'retries', header: 'Retries', render: (r: KYCRequest) => r.retries },
    { key: 'status', header: 'Status', render: (r: KYCRequest) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: KYCRequest) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>Review</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); setApproveOpen(true) }}>Approve</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => { setSelected(r); rejectForm.reset({ retryAllowed: true }); setRejectOpen(true) }}>Reject</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Trust & Safety', 'KYC']} title="Identity Verification" />
      <FilterBar
        search={{ placeholder: 'Search user…', value: search, onChange: setSearch }}
        selects={[{ label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS }]}
      />
      <DataTable columns={COLUMNS} data={items} loading={isLoading} empty={<EmptyState icon={ShieldCheck} heading="No pending verifications" sub="Submitted ID documents will appear here." />} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected?.user.displayName ?? ''} subtitle={selected?.docType}
        footer={
          <div className="flex gap-[10px]">
            <button className="flex-1 bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => { setDrawerOpen(false); setApproveOpen(true) }}>Approve</button>
            <button className="flex-1 bg-gf-red text-white border-0 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => { setDrawerOpen(false); rejectForm.reset({ retryAllowed: true }); setRejectOpen(true) }}>Reject</button>
          </div>
        }
      >
        {selected && (
          <div>
            <div className="bg-gf-pink-100 rounded-[14px] h-[180px] flex items-center justify-center [margin-bottom:16px] text-[13px] text-gf-muted">
              [Document image — {selected.docType}]
            </div>
            <div className="bg-gf-pink-100 rounded-[14px] h-[140px] flex items-center justify-center [margin-bottom:20px] text-[13px] text-gf-muted">
              [Selfie image]
            </div>
            {[
              { label: 'Full name', value: selected.user.displayName },
              { label: 'Email', value: selected.user.email },
              { label: 'Submitted', value: selected.submitted },
              { label: 'Retries', value: selected.retries },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog open={approveOpen} onOpenChange={setApproveOpen} title="Approve identity verification?" description="The user will be marked as ID-verified and can list cameras." onConfirm={() => { if (selected) approveMutation.mutate(selected.id); setApproveOpen(false) }} />

      <FormDialog open={rejectOpen} onOpenChange={setRejectOpen} title="Reject Verification" submitLabel="Reject" onSubmit={rejectForm.handleSubmit(data => { if (selected) rejectMutation.mutate({ id: selected.id, reason: data.reason }); setRejectOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div><Label>Rejection reason</Label><Textarea {...rejectForm.register('reason')} placeholder="Explain why the document was rejected…" className="[margin-top:6px]" /></div>
          <label className="flex items-center gap-[8px] text-[13px]">
            <input type="checkbox" {...rejectForm.register('retryAllowed')} />
            Allow user to retry
          </label>
        </form>
      </FormDialog>
    </div>
  )
}
