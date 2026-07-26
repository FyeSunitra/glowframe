'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AlertTriangle, MoreHorizontal } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { money } from '@/lib/utils'
import { useMenuI18n } from '@/hooks/useMenuI18n'
import { useToast } from '@/hooks/useToast'

interface Dispute { id: number; disputeId: string; bookingNo: string; openedBy: string; type: string; claimAmount: number; opened: string; status: string }

const TYPE_OPTIONS = [{ value: '', label: 'All types' }, { value: 'damage', label: 'Damage' }, { value: 'late-return', label: 'Late return' }, { value: 'no-show', label: 'No-show' }, { value: 'mismatch', label: 'Mismatch' }, { value: 'other', label: 'Other' }]
const TABS = ['Pending', 'In Review', 'Resolved']

const rulingSchema = z.object({ notes: z.string().min(1), amount: z.number().min(0) })
type RulingForm = z.infer<typeof rulingSchema>

export default function DisputesPage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('Pending')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selected, setSelected] = useState<Dispute | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [renterRulingOpen, setRenterRulingOpen] = useState(false)
  const [ownerRulingOpen, setOwnerRulingOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)

  const tab = activeTab === 'In Review' ? 'in-review' : activeTab === 'Resolved' ? 'resolved' : 'pending'
  const filters = { search, type: typeFilter, tab }
  const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
    queryKey: ['admin', 'trust', 'disputes', filters],
    queryFn: () => axios.get('/api/admin/trust/disputes', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'trust', 'disputes'] })
  const assignMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/trust/disputes/${id}`, { action: 'assign' }), onSuccess: () => { invalidate(); showToast(tr('Assigned to you')) } })
  const closeMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/trust/disputes/${id}`, { action: 'close' }), onSuccess: () => { invalidate(); showToast(tr('Dispute closed')) } })
  const renterForm = useForm<RulingForm>({ resolver: zodResolver(rulingSchema), defaultValues: { amount: 0 } })
  const ownerForm = useForm<RulingForm>({ resolver: zodResolver(rulingSchema), defaultValues: { amount: 0 } })

  const COLUMNS = [
    { key: 'disputeId', header: 'Dispute ID', render: (r: Dispute) => <span className="font-[var(--font-poppins)] font-semibold text-[13px]">{r.disputeId}</span> },
    { key: 'bookingNo', header: 'Booking #', render: (r: Dispute) => r.bookingNo },
    { key: 'openedBy', header: 'Opened by', render: (r: Dispute) => <StatusBadge status={r.openedBy === 'renter' ? 'active' : 'pending'} /> },
    { key: 'type', header: 'Type', render: (r: Dispute) => <span className="[text-transform:capitalize]">{r.type.replace('-', ' ')}</span> },
    { key: 'claimAmount', header: 'Claim amount', render: (r: Dispute) => `${money(r.claimAmount)} THB` },
    { key: 'opened', header: 'Opened', render: (r: Dispute) => <span className="text-[12.5px] text-gf-muted">{r.opened}</span> },
    { key: 'status', header: 'Status', render: (r: Dispute) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: Dispute) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>{tr('View')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => assignMutation.mutate(r.id)}>{tr('Assign to me')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); renterForm.reset({ amount: 0 }); setRenterRulingOpen(true) }}>{tr('Rule for renter')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); ownerForm.reset({ amount: 0 }); setOwnerRulingOpen(true) }}>{tr('Rule for owner')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); setCloseOpen(true) }}>{tr('Close without action')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Trust & Safety', 'Disputes']} title="Disputes & Claims" />
      <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />
      <FilterBar
        search={{ placeholder: 'Search dispute or booking…', value: search, onChange: setSearch }}
        selects={[{ label: 'Type', value: typeFilter, onChange: setTypeFilter, options: TYPE_OPTIONS }]}
      />
      <DataTable columns={COLUMNS} data={disputes} loading={isLoading} empty={<EmptyState icon={AlertTriangle} heading="No open disputes" sub="Disputes appear here when users raise claims." />} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? `Dispute ${selected.disputeId}` : ''} subtitle={selected?.type}
        footer={
          <button className="w-full bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => { setDrawerOpen(false); renterForm.reset({ amount: 0 }); setRenterRulingOpen(true) }}>
            Submit Ruling
          </button>
        }
      >
        {selected && (
          <div>
            {[
              { label: 'Booking #', value: selected.bookingNo },
              { label: 'Opened by', value: selected.openedBy },
              { label: 'Type', value: selected.type },
              { label: 'Claim amount', value: `${money(selected.claimAmount)} THB` },
              { label: 'Opened', value: selected.opened },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{tr(r.label)}</span>
                <span className="font-medium [text-transform:capitalize]">{r.value}</span>
              </div>
            ))}
          </div>
        )}
      </DetailDrawer>

      <FormDialog open={renterRulingOpen} onOpenChange={setRenterRulingOpen} title="Rule in favour of renter" submitLabel="Submit ruling" onSubmit={renterForm.handleSubmit(() => { showToast(tr('Ruling submitted — renter favoured')); setRenterRulingOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div><Label>Ruling notes</Label><Textarea {...renterForm.register('notes')} className="[margin-top:6px]" /></div>
          <div><Label>Refund amount (THB)</Label><Input type="number" {...renterForm.register('amount', { valueAsNumber: true })} className="[margin-top:6px]" /></div>
        </form>
      </FormDialog>
      <FormDialog open={ownerRulingOpen} onOpenChange={setOwnerRulingOpen} title="Rule in favour of owner" submitLabel="Submit ruling" onSubmit={ownerForm.handleSubmit(() => { showToast(tr('Ruling submitted — owner favoured')); setOwnerRulingOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div><Label>Ruling notes</Label><Textarea {...ownerForm.register('notes')} className="[margin-top:6px]" /></div>
          <div><Label>Penalty amount (THB)</Label><Input type="number" {...ownerForm.register('amount', { valueAsNumber: true })} className="[margin-top:6px]" /></div>
        </form>
      </FormDialog>
      <ConfirmDialog open={closeOpen} onOpenChange={setCloseOpen} title="Close without action?" description="This dispute will be marked resolved with no financial action taken." onConfirm={() => { if (selected) closeMutation.mutate(selected.id); setCloseOpen(false) }} />
    </div>
  )
}
