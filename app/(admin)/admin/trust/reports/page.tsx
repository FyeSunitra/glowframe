'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Flag, MoreHorizontal } from 'lucide-react'
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

interface Report { id: number; reporter: string; entity: string; entityType: string; reason: string; details: string; submitted: string; status: string }

const REASON_OPTIONS = [{ value: '', label: 'All reasons' }, { value: 'fraud', label: 'Fraud' }, { value: 'fake-listing', label: 'Fake listing' }, { value: 'scam', label: 'Scam' }, { value: 'inappropriate', label: 'Inappropriate' }, { value: 'other', label: 'Other' }]
const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, { value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'dismissed', label: 'Dismissed' }]

const warnSchema = z.object({ message: z.string().min(1) })
type WarnForm = z.infer<typeof warnSchema>

export default function ReportsPage() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [reasonFilter, setReasonFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Report | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [warnOpen, setWarnOpen] = useState(false)
  const [dismissOpen, setDismissOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)

  const filters = { search, reason: reasonFilter, status: statusFilter }
  const { data: reports = [], isLoading } = useQuery<Report[]>({
    queryKey: ['admin', 'trust', 'reports', filters],
    queryFn: () => axios.get('/api/admin/trust/reports', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'trust', 'reports'] })
  const dismissMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/trust/reports/${id}`, { action: 'dismiss' }), onSuccess: () => { invalidate(); showToast('Report dismissed') } })
  const warnForm = useForm<WarnForm>({ resolver: zodResolver(warnSchema) })

  const COLUMNS = [
    { key: 'reporter', header: 'Reporter', render: (r: Report) => r.reporter },
    { key: 'entity', header: 'Reported entity', render: (r: Report) => (
      <span>
        <span className="text-[11px] [padding:2px_7px] rounded-full bg-gf-pink-100 text-gf-brown-700 font-semibold [margin-right:6px]">{r.entityType}</span>
        {r.entity}
      </span>
    )},
    { key: 'reason', header: 'Reason', render: (r: Report) => <span className="[text-transform:capitalize]">{r.reason.replace('-', ' ')}</span> },
    { key: 'details', header: 'Details', render: (r: Report) => <span className="text-[12.5px] text-gf-muted">{r.details.slice(0, 80)}{r.details.length > 80 ? '…' : ''}</span> },
    { key: 'submitted', header: 'Submitted', render: (r: Report) => <span className="text-[12.5px] text-gf-muted">{r.submitted}</span> },
    { key: 'status', header: 'Status', render: (r: Report) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: Report) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); warnForm.reset(); setWarnOpen(true) }}>Warn user</DropdownMenuItem>
          {r.entityType === 'listing' && <DropdownMenuItem variant="destructive" onClick={() => { setSelected(r); setRemoveOpen(true) }}>Remove listing</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onClick={() => { setSelected(r); setSuspendOpen(true) }}>Suspend user</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); setDismissOpen(true) }}>Dismiss</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Trust & Safety', 'Reports']} title="Reports" />
      <FilterBar
        search={{ placeholder: 'Search reporter or entity…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Reason', value: reasonFilter, onChange: setReasonFilter, options: REASON_OPTIONS },
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
        ]}
      />
      <DataTable columns={COLUMNS} data={reports} loading={isLoading} empty={<EmptyState icon={Flag} heading="No reports submitted" sub="User-submitted reports appear here." />} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={`Report — ${selected?.entity ?? ''}`} subtitle={selected?.reason}>
        {selected && (
          <div>
            {[
              { label: 'Reporter', value: selected.reporter },
              { label: 'Reported entity', value: `${selected.entityType}: ${selected.entity}` },
              { label: 'Reason', value: selected.reason },
              { label: 'Submitted', value: selected.submitted },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:16px] [padding:16px] bg-gf-pink-100 rounded-[14px] text-[13px] [line-height:1.6]">{selected.details}</div>
          </div>
        )}
      </DetailDrawer>

      <FormDialog open={warnOpen} onOpenChange={setWarnOpen} title="Warn User" submitLabel="Send warning" onSubmit={warnForm.handleSubmit(() => { showToast('Warning sent'); setWarnOpen(false) })}>
        <form><Label>Warning message</Label><Textarea {...warnForm.register('message')} placeholder="Describe the policy violation…" className="[margin-top:6px]" /></form>
      </FormDialog>
      <ConfirmDialog open={removeOpen} onOpenChange={setRemoveOpen} title="Remove this listing?" description="The listing will be taken down immediately." destructive onConfirm={() => { showToast('Listing removed'); setRemoveOpen(false) }} />
      <ConfirmDialog open={suspendOpen} onOpenChange={setSuspendOpen} title="Suspend this user?" description="The user will lose access to the platform." destructive onConfirm={() => { showToast('Account suspended'); setSuspendOpen(false) }} />
      <ConfirmDialog open={dismissOpen} onOpenChange={setDismissOpen} title="Dismiss this report?" description="The report will be marked as dismissed." onConfirm={() => { if (selected) dismissMutation.mutate(selected.id); setDismissOpen(false) }} />
    </div>
  )
}
