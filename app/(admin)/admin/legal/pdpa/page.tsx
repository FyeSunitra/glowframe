'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Scale, MoreHorizontal } from 'lucide-react'
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { useMenuI18n } from '@/hooks/useMenuI18n'

interface PDPARequest { id: number; requestId: string; user: { displayName: string; email: string }; type: string; submitted: string; dueDate: string; status: string }

const TYPE_OPTIONS = [{ value: '', label: 'All types' }, { value: 'access', label: 'Access' }, { value: 'rectification', label: 'Rectification' }, { value: 'erasure', label: 'Erasure' }, { value: 'restriction', label: 'Restriction' }, { value: 'portability', label: 'Portability' }, { value: 'objection', label: 'Objection' }]
const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' }, { value: 'in-progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }, { value: 'overdue', label: 'Overdue' }]

const completeSchema = z.object({ notes: z.string().optional() })
type CompleteForm = z.infer<typeof completeSchema>

function dueDateColor(due: string): string {
  const days = Math.floor((new Date(due).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'var(--gf-red)'
  if (days <= 7) return 'var(--gf-yellow)'
  return 'var(--gf-green)'
}

export default function PDPAPage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<PDPARequest | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)

  const filters = { search, type: typeFilter, status: statusFilter }
  const { data: requests = [], isLoading } = useQuery<PDPARequest[]>({
    queryKey: ['admin', 'legal', 'pdpa', filters],
    queryFn: () => axios.get('/api/admin/legal/pdpa', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'legal', 'pdpa'] })
  const progressMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/legal/pdpa/${id}`, { action: 'in-progress' }), onSuccess: () => { invalidate(); showToast(tr('Marked in progress')) } })
  const completeMutation = useMutation({ mutationFn: ({ id, notes }: { id: number; notes?: string }) => axios.patch(`/api/admin/legal/pdpa/${id}`, { action: 'complete', notes }), onSuccess: () => { invalidate(); showToast(tr('Request completed')) } })
  const completeForm = useForm<CompleteForm>({ resolver: zodResolver(completeSchema) })

  const COLUMNS = [
    { key: 'requestId', header: 'Request ID', render: (r: PDPARequest) => <span className="font-[var(--font-poppins)] font-semibold text-[12px]">{r.requestId}</span> },
    { key: 'user', header: 'User', render: (r: PDPARequest) => (
      <span className="cursor-pointer" onClick={() => { setSelected(r); setDrawerOpen(true) }}>
        <div className="font-semibold text-[13px]">{r.user.displayName}</div>
        <div className="text-[12px] text-gf-muted">{r.user.email}</div>
      </span>
    )},
    { key: 'type', header: 'Type', render: (r: PDPARequest) => <span className="[text-transform:capitalize]">{r.type}</span> },
    { key: 'submitted', header: 'Submitted', render: (r: PDPARequest) => <span className="text-[12.5px] text-gf-muted">{r.submitted}</span> },
    { key: 'dueDate', header: 'Due date', render: (r: PDPARequest) => <span className="text-[12.5px] font-semibold" style={{ color: dueDateColor(r.dueDate) }}>{r.dueDate}</span> },
    { key: 'status', header: 'Status', render: (r: PDPARequest) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: PDPARequest) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>{tr('View')}</DropdownMenuItem>
          {r.status === 'pending' && <DropdownMenuItem onClick={() => progressMutation.mutate(r.id)}>{tr('Mark in progress')}</DropdownMenuItem>}
          {r.status !== 'completed' && <DropdownMenuItem onClick={() => { setSelected(r); completeForm.reset(); setCompleteOpen(true) }}>{tr('Complete')}</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Legal', 'PDPA']} title="PDPA Data Requests" />
      <FilterBar
        search={{ placeholder: 'Search request or user…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Type', value: typeFilter, onChange: setTypeFilter, options: TYPE_OPTIONS },
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
        ]}
      />
      <DataTable columns={COLUMNS} data={requests} loading={isLoading} empty={<EmptyState icon={Scale} heading="No data requests submitted" sub="PDPA data subject requests appear here." />} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected?.requestId ?? ''} subtitle={selected?.type}
        footer={
          <div className="flex gap-[10px]">
            {selected?.status !== 'completed' && <button className="flex-1 bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => { setDrawerOpen(false); completeForm.reset(); setCompleteOpen(true) }}>{tr('Complete')}</button>}
          </div>
        }
      >
        {selected && (
          <div>
            {[
              { label: 'Request type', value: selected.type },
              { label: 'Submitted', value: selected.submitted },
              { label: 'Due date', value: selected.dueDate },
              { label: 'User', value: selected.user.displayName },
              { label: 'Email', value: selected.user.email },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{tr(r.label)}</span>
                <span className="font-medium [text-transform:capitalize]">{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:20px]">
              <div className="text-[14px] font-semibold [margin-bottom:8px] text-gf-brown-900">{tr('Timeline')}</div>
              {[{ event: 'Request submitted', date: selected.submitted }, { event: 'Under review', date: selected.status !== 'pending' ? 'In progress' : '—' }, { event: 'Completed', date: selected.status === 'completed' ? 'Done' : '—' }].map(t => (
                <div key={t.event} className="flex justify-between [padding:8px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                  <span>{t.event}</span>
                  <span className="text-gf-muted">{t.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>

      <FormDialog open={completeOpen} onOpenChange={setCompleteOpen} title="Complete Request" submitLabel="Mark complete" onSubmit={completeForm.handleSubmit(data => { if (selected) completeMutation.mutate({ id: selected.id, notes: data.notes }); setCompleteOpen(false) })}>
        <form>
          <Label>Response notes (optional)</Label>
          <Textarea {...completeForm.register('notes')} placeholder="Describe what action was taken…" className="[margin-top:6px]" />
        </form>
      </FormDialog>
    </div>
  )
}
