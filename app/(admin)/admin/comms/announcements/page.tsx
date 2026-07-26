'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Bell, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { PillTabs } from '@/components/admin/shared/PillTabs'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { useMenuI18n } from '@/hooks/useMenuI18n'

interface Announcement { id: number; title: string; segment: string; sendTime: string | null; recipients: number; readRate: number; status: string }

const SEGMENT_OPTIONS = [{ value: '', label: 'All segments' }, { value: 'all', label: 'All users' }, { value: 'owners', label: 'Owners only' }, { value: 'renters', label: 'Renters only' }]
const TABS = ['All', 'Drafts', 'Scheduled', 'Sent']

const annSchema = z.object({ title: z.string().min(1), body: z.string().min(1), segment: z.string().min(1), sendMode: z.string(), channel: z.string() })
type AnnForm = z.infer<typeof annSchema>

export default function AnnouncementsPage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [sendNowId, setSendNowId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const tab = activeTab === 'All' ? 'all' : activeTab.toLowerCase()
  const { data: items = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['admin', 'comms', 'announcements', { tab, search, segment: segmentFilter }],
    queryFn: () => axios.get('/api/admin/comms/announcements', { params: { tab, search, segment: segmentFilter } }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'comms', 'announcements'] })
  const saveMutation = useMutation({ mutationFn: (body: Partial<AnnForm> & { id?: number }) => { const { id, ...rest } = body; return id ? axios.patch(`/api/admin/comms/announcements/${id}`, rest) : axios.post('/api/admin/comms/announcements', rest) }, onSuccess: () => { invalidate(); showToast(tr('Announcement saved')) } })
  const sendMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/comms/announcements/${id}`, { action: 'send' }), onSuccess: () => { invalidate(); showToast(tr('Announcement sent')) } })
  const deleteMutation = useMutation({ mutationFn: (id: number) => axios.delete(`/api/admin/comms/announcements/${id}`), onSuccess: () => { invalidate(); showToast(tr('Deleted')) } })
  const dupMutation = useMutation({ mutationFn: (id: number) => axios.post(`/api/admin/comms/announcements/${id}/duplicate`), onSuccess: () => { invalidate(); showToast(tr('Duplicated')) } })

  const form = useForm<AnnForm>({ resolver: zodResolver(annSchema), defaultValues: { segment: 'all', sendMode: 'immediate', channel: 'in-app' } })

  const COLUMNS = [
    { key: 'title', header: 'Title', render: (r: Announcement) => <span className="font-semibold">{r.title}</span> },
    { key: 'segment', header: 'Segment', render: (r: Announcement) => <span className="[text-transform:capitalize]">{r.segment === 'all' ? 'All users' : `${r.segment} only`}</span> },
    { key: 'sendTime', header: 'Send time', render: (r: Announcement) => r.sendTime ?? 'Immediate' },
    { key: 'recipients', header: 'Recipients', render: (r: Announcement) => r.recipients || '—' },
    { key: 'readRate', header: 'Read rate', render: (r: Announcement) => r.readRate ? `${r.readRate}%` : '—' },
    { key: 'status', header: 'Status', render: (r: Announcement) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: Announcement) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          {r.status === 'draft' && <DropdownMenuItem onClick={() => { setEditTarget(r); form.reset({ title: r.title, segment: r.segment, sendMode: 'immediate', channel: 'in-app', body: '' }); setFormOpen(true) }}>{tr('Edit')}</DropdownMenuItem>}
          {r.status !== 'sent' && <DropdownMenuItem onClick={() => setSendNowId(r.id)}>{tr('Send now')}</DropdownMenuItem>}
          <DropdownMenuItem onClick={() => dupMutation.mutate(r.id)}>{tr('Duplicate')}</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(r.id)}>{tr('Delete')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Communications', 'Announcements']}
        title="Announcements"
        action={<button onClick={() => { setEditTarget(null); form.reset({ segment: 'all', sendMode: 'immediate', channel: 'in-app' }); setFormOpen(true) }} className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">{tr('+ New announcement')}</button>}
      />
      <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />
      <FilterBar
        search={{ placeholder: 'Search announcements…', value: search, onChange: setSearch }}
        selects={[{ label: 'Segment', value: segmentFilter, onChange: setSegmentFilter, options: SEGMENT_OPTIONS }]}
      />
      <DataTable columns={COLUMNS} data={items} loading={isLoading} empty={<EmptyState icon={Bell} heading="No announcements yet" sub="Create your first announcement to notify users." />} />

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editTarget ? 'Edit Announcement' : 'New Announcement'} submitLabel={editTarget ? 'Save' : 'Create'} onSubmit={form.handleSubmit(data => { saveMutation.mutate({ ...data, id: editTarget?.id }); setFormOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div><Label>Title</Label><Input {...form.register('title')} className="[margin-top:6px]" /></div>
          <div><Label>Body (use {`{{user_name}}`} for name)</Label><Textarea {...form.register('body')} rows={4} className="[margin-top:6px]" /></div>
          <div>
            <Label>Target segment</Label>
            <Select value={form.watch('segment')} onValueChange={v => form.setValue('segment', v ?? 'all')}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="owners">Owners only</SelectItem>
                <SelectItem value="renters">Renters only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog open={sendNowId !== null} onOpenChange={open => { if (!open) setSendNowId(null) }} title="Send this announcement now?" description="It will be delivered to all targeted users immediately." onConfirm={() => { if (sendNowId !== null) sendMutation.mutate(sendNowId); setSendNowId(null) }} />
      <ConfirmDeleteDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null) }} pending={deleteMutation.isPending} onConfirm={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); setDeleteId(null) }} />
    </div>
  )
}
