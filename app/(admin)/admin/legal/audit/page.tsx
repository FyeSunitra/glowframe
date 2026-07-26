'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { ClipboardList } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { useMenuI18n } from '@/hooks/useMenuI18n'

interface AuditEntry {
  id: number
  timestamp: string
  actor: { email: string; role: string }
  action: string
  entity: { type: string; id: string }
  summary: string
  delta: { before: object; after: object }
}

const ACTOR_OPTIONS = [{ value: '', label: 'All actors' }, { value: 'admin@glowframe.com', label: 'Admin' }, { value: 'finance@glowframe.com', label: 'Finance' }]
const ACTION_OPTIONS = [{ value: '', label: 'All actions' }, { value: 'user', label: 'user.*' }, { value: 'product', label: 'product.*' }, { value: 'booking', label: 'booking.*' }, { value: 'payout', label: 'payout.*' }, { value: 'settings', label: 'settings.*' }]

function formatTs(ts: string) {
  try {
    const d = new Date(ts)
    return `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}, ${d.toTimeString().slice(0, 8)}`
  } catch { return ts }
}

export default function AuditLogPage() {
  const { tr } = useMenuI18n()
  const [search, setSearch] = useState('')
  const [actorFilter, setActorFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [deltaOpen, setDeltaOpen] = useState(false)

  const filters = { search, actor: actorFilter, action: actionFilter }
  const { data: entries = [], isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['admin', 'legal', 'audit', filters],
    queryFn: () => axios.get('/api/admin/legal/audit', { params: filters }).then(r => r.data.data),
  })

  const COLUMNS = [
    { key: 'timestamp', header: 'Timestamp', render: (r: AuditEntry) => <span className="font-[var(--font-poppins)] text-[12px]">{formatTs(r.timestamp)}</span> },
    { key: 'actor', header: 'Actor', render: (r: AuditEntry) => (
      <span>
        <div className="font-semibold text-[13px]">{r.actor.email}</div>
        <span className="text-[11px] [padding:2px_7px] rounded-full bg-gf-pink-100 text-gf-brown-700 font-semibold">{r.actor.role}</span>
      </span>
    )},
    { key: 'action', header: 'Action', render: (r: AuditEntry) => <span className="font-[var(--font-poppins)] text-[12px] font-semibold">{r.action}</span> },
    { key: 'entity', header: 'Entity', render: (r: AuditEntry) => (
      <span>
        <span className="text-[11px] [padding:2px_7px] rounded-full bg-gf-pink-100 text-gf-brown-700 font-semibold [margin-right:6px]">{r.entity.type}</span>
        <span className="font-[var(--font-poppins)] text-[12px]">#{r.entity.id}</span>
      </span>
    )},
    { key: 'summary', header: 'Summary', render: (r: AuditEntry) => <span className="text-[13px]">{r.summary}</span> },
    { key: 'delta', header: '', render: (r: AuditEntry) => (
      <button onClick={() => { setSelectedEntry(r); setDeltaOpen(true) }} className="text-[12px] [padding:4px_10px] rounded-full [border:1.5px_solid_var(--gf-brown-300)] bg-transparent cursor-pointer text-gf-brown-700">
        View diff
      </button>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Legal', 'Audit Log']}
        title="Audit Log"
        action={<button className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">{tr('Export CSV')}</button>}
      />
      <FilterBar
        search={{ placeholder: 'Search actor or entity ID…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Actor', value: actorFilter, onChange: setActorFilter, options: ACTOR_OPTIONS },
          { label: 'Action', value: actionFilter, onChange: setActionFilter, options: ACTION_OPTIONS },
        ]}
      />
      <DataTable columns={COLUMNS} data={entries} loading={isLoading} empty={<EmptyState icon={ClipboardList} heading="No audit entries yet" sub="Every admin action is automatically logged here." />} />

      <FormDialog open={deltaOpen} onOpenChange={setDeltaOpen} title="Delta — Before / After" submitLabel="Close" onSubmit={() => setDeltaOpen(false)}>
        {selectedEntry && (
          <div className="grid [grid-template-columns:1fr_1fr] gap-[12px]">
            <div>
              <div className="text-[12px] font-semibold text-gf-muted [margin-bottom:8px]">{tr('BEFORE')}</div>
              <pre className="bg-gf-pink-100 rounded-[10px] [padding:14px] text-[12px] [margin:0] overflow-x-auto">
                {JSON.stringify(selectedEntry.delta.before, null, 2).split('\n').map((line, i) => {
                  const key = line.match(/"(\w+)":/)?.[1]
                  const afterObj = selectedEntry.delta.after as Record<string, unknown>
                  const beforeObj = selectedEntry.delta.before as Record<string, unknown>
                  const changed = key && afterObj[key] !== beforeObj[key]
                  return <span key={i} className={cn('block', changed && 'rounded bg-gf-pink-300')}>{line}</span>
                })}
              </pre>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-gf-muted [margin-bottom:8px]">{tr('AFTER')}</div>
              <pre className="bg-gf-pink-100 rounded-[10px] [padding:14px] text-[12px] [margin:0] overflow-x-auto">
                {JSON.stringify(selectedEntry.delta.after, null, 2).split('\n').map((line, i) => {
                  const key = line.match(/"(\w+)":/)?.[1]
                  const afterObj = selectedEntry.delta.after as Record<string, unknown>
                  const beforeObj = selectedEntry.delta.before as Record<string, unknown>
                  const changed = key && afterObj[key] !== beforeObj[key]
                  return <span key={i} className={cn('block', changed && 'rounded bg-gf-pink-300')}>{line}</span>
                })}
              </pre>
            </div>
          </div>
        )}
      </FormDialog>
    </div>
  )
}
