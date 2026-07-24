'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { ToggleLeft, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

interface FeatureFlag { id: number; key: string; description: string; target: string; enabled: boolean; lastChanged: string; lastChangedBy: string }

const STATUS_OPTIONS = [{ value: '', label: 'All' }, { value: 'enabled', label: 'Enabled' }, { value: 'disabled', label: 'Disabled' }]
const TARGET_OPTIONS = [{ value: '', label: 'All targets' }, { value: 'all', label: 'All users' }, { value: 'owners', label: 'Owners only' }, { value: 'renters', label: 'Renters only' }]

const flagSchema = z.object({ key: z.string().min(1).regex(/^[a-z_]+$/), description: z.string().min(1), target: z.string().min(1), enabled: z.boolean() })
type FlagForm = z.infer<typeof flagSchema>

export default function FeatureFlagsPage() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')
  const [editTarget, setEditTarget] = useState<FeatureFlag | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [toggleId, setToggleId] = useState<number | null>(null)
  const [toggleEnabled, setToggleEnabled] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filters = { search, status: statusFilter, target: targetFilter }
  const { data: flags = [], isLoading } = useQuery<FeatureFlag[]>({
    queryKey: ['admin', 'config', 'feature-flags', filters],
    queryFn: () => axios.get('/api/admin/config/feature-flags', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'config', 'feature-flags'] })
  const saveMutation = useMutation({
    mutationFn: (data: Partial<FlagForm> & { id?: number }) => {
      const { id, ...body } = data
      return id ? axios.patch(`/api/admin/config/feature-flags/${id}`, body) : axios.post('/api/admin/config/feature-flags', body)
    },
    onSuccess: () => { invalidate(); showToast('Feature flag saved') },
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => axios.patch(`/api/admin/config/feature-flags/${id}`, { enabled }),
    onSuccess: () => { invalidate(); showToast('Flag updated') },
  })
  const deleteMutation = useMutation({ mutationFn: (id: number) => axios.delete(`/api/admin/config/feature-flags/${id}`), onSuccess: () => { invalidate(); showToast('Flag deleted') } })

  const form = useForm<FlagForm>({ resolver: zodResolver(flagSchema), defaultValues: { target: 'all', enabled: false } })

  const COLUMNS = [
    { key: 'key', header: 'Flag key', render: (r: FeatureFlag) => <span className="font-[var(--font-poppins)] text-[12px] font-semibold">{r.key}</span> },
    { key: 'description', header: 'Description', render: (r: FeatureFlag) => <span className="text-[13px] text-gf-muted">{r.description}</span> },
    { key: 'target', header: 'Target', render: (r: FeatureFlag) => <span className="[text-transform:capitalize]">{r.target === 'all' ? 'All users' : `${r.target} only`}</span> },
    { key: 'enabled', header: 'Enabled', render: (r: FeatureFlag) => (
      <button
        onClick={() => { setToggleId(r.id); setToggleEnabled(!r.enabled) }}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 py-1 text-xs font-semibold',
          r.enabled ? 'bg-gf-green text-white' : 'bg-gf-line text-gf-muted',
        )}
      >
        <span className="w-[8px] h-[8px] rounded-full bg-white inline-block" />
        {r.enabled ? 'On' : 'Off'}
      </button>
    )},
    { key: 'lastChanged', header: 'Last changed', render: (r: FeatureFlag) => (
      <span>
        <div className="text-[12.5px]">{r.lastChanged}</div>
        <div className="text-[12px] text-gf-muted">{r.lastChangedBy}</div>
      </span>
    )},
    { key: 'actions', header: '', render: (r: FeatureFlag) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setEditTarget(r); form.reset({ key: r.key, description: r.description, target: r.target, enabled: r.enabled }); setFormOpen(true) }}>Edit</DropdownMenuItem>
          {!r.enabled && <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(r.id)}>Delete</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Platform Config', 'Feature Flags']}
        title="Feature Flags"
        action={<button onClick={() => { setEditTarget(null); form.reset({ target: 'all', enabled: false }); setFormOpen(true) }} className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">+ New flag</button>}
      />
      <FilterBar
        search={{ placeholder: 'Search flag key or description…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
          { label: 'Target', value: targetFilter, onChange: setTargetFilter, options: TARGET_OPTIONS },
        ]}
      />
      <DataTable columns={COLUMNS} data={flags} loading={isLoading} empty={<EmptyState icon={ToggleLeft} heading="No feature flags defined" sub="Feature flags let you toggle platform features without deploying code." />} />

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editTarget ? 'Edit Flag' : 'New Flag'} submitLabel={editTarget ? 'Save' : 'Create'} onSubmit={form.handleSubmit(data => { saveMutation.mutate({ ...data, id: editTarget?.id }); setFormOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div><Label>Flag key (snake_case)</Label><Input {...form.register('key')} placeholder="feature_name" className="[margin-top:6px] font-[var(--font-poppins)]" disabled={!!editTarget} /></div>
          <div><Label>Description</Label><Textarea {...form.register('description')} className="[margin-top:6px]" /></div>
          <div>
            <Label>Target segment</Label>
            <Select value={form.watch('target')} onValueChange={v => form.setValue('target', v ?? 'all')}>
              <SelectTrigger className="[margin-top:6px] rounded-full h-[40px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="owners">Owners only</SelectItem>
                <SelectItem value="renters">Renters only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-[8px] text-[13px]">
            <input type="checkbox" {...form.register('enabled')} />
            Enabled by default
          </label>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={toggleId !== null}
        onOpenChange={open => { if (!open) setToggleId(null) }}
        title={`${toggleEnabled ? 'Enable' : 'Disable'} this flag?`}
        description={toggleEnabled ? 'This flag will affect all targeted users immediately.' : 'This flag will be disabled immediately.'}
        onConfirm={() => { if (toggleId !== null) toggleMutation.mutate({ id: toggleId, enabled: toggleEnabled }); setToggleId(null) }}
      />
      <ConfirmDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null) }} title="Delete this flag?" description="The flag will be permanently removed." destructive onConfirm={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); setDeleteId(null) }} />
    </div>
  )
}
