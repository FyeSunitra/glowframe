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
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

interface Report { id: number; reporter: string; entity: string; entityType: string; reason: string; details: string; submitted: string; status: string }

const warnSchema = z.object({ message: z.string().min(1) })
type WarnForm = z.infer<typeof warnSchema>

export default function ReportsPage() {
  const t = getPageText(useAppStore((s) => s.locale), 'adminReports')
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
  const dismissMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/trust/reports/${id}`, { action: 'dismiss' }), onSuccess: () => { invalidate(); showToast(t.reportDismissed) } })
  const warnForm = useForm<WarnForm>({ resolver: zodResolver(warnSchema) })
  const reasonOptions = [
    { value: '', label: t.allReasons },
    { value: 'fraud', label: t.fraud },
    { value: 'fake-listing', label: t.fakeListing },
    { value: 'scam', label: t.scam },
    { value: 'inappropriate', label: t.inappropriate },
    { value: 'other', label: t.other },
  ]
  const statusOptions = [
    { value: '', label: t.allStatuses },
    { value: 'open', label: t.open },
    { value: 'resolved', label: t.resolved },
    { value: 'dismissed', label: t.dismissed },
  ]

  const COLUMNS = [
    { key: 'reporter', header: t.reporter, render: (r: Report) => r.reporter },
    { key: 'entity', header: t.reportedEntity, render: (r: Report) => (
      <span>
        <span className="text-[11px] [padding:2px_7px] rounded-full bg-gf-pink-100 text-gf-brown-700 font-semibold [margin-right:6px]">{r.entityType}</span>
        {r.entity}
      </span>
    )},
    { key: 'reason', header: t.reason, render: (r: Report) => <span className="[text-transform:capitalize]">{r.reason.replace('-', ' ')}</span> },
    { key: 'details', header: t.details, render: (r: Report) => <span className="text-[12.5px] text-gf-muted">{r.details.slice(0, 80)}{r.details.length > 80 ? '…' : ''}</span> },
    { key: 'submitted', header: t.submitted, render: (r: Report) => <span className="text-[12.5px] text-gf-muted">{r.submitted}</span> },
    { key: 'status', header: t.status, render: (r: Report) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: Report) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>{t.view}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); warnForm.reset(); setWarnOpen(true) }}>{t.warnUser}</DropdownMenuItem>
          {r.entityType === 'listing' && <DropdownMenuItem variant="destructive" onClick={() => { setSelected(r); setRemoveOpen(true) }}>{t.removeListing}</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onClick={() => { setSelected(r); setSuspendOpen(true) }}>{t.suspendUser}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); setDismissOpen(true) }}>{t.dismiss}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.trustSafety, t.title]} title={t.title} />
      <FilterBar
        search={{ placeholder: t.search, value: search, onChange: setSearch }}
        selects={[
          { label: t.reason, value: reasonFilter, onChange: setReasonFilter, options: reasonOptions },
          { label: t.status, value: statusFilter, onChange: setStatusFilter, options: statusOptions },
        ]}
      />
      <DataTable columns={COLUMNS} data={reports} loading={isLoading} empty={<EmptyState icon={Flag} heading={t.noReports} sub={t.noReportsSub} />} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={`${t.reportPrefix} — ${selected?.entity ?? ''}`} subtitle={selected?.reason}>
        {selected && (
          <div>
            {[
              { label: t.reporter, value: selected.reporter },
              { label: t.reportedEntity, value: `${selected.entityType}: ${selected.entity}` },
              { label: t.reason, value: selected.reason },
              { label: t.submitted, value: selected.submitted },
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

      <FormDialog open={warnOpen} onOpenChange={setWarnOpen} title={t.warnTitle} submitLabel={t.sendWarning} onSubmit={warnForm.handleSubmit(() => { showToast(t.warningSent); setWarnOpen(false) })}>
        <form><Label>{t.warningMessage}</Label><Textarea {...warnForm.register('message')} placeholder={t.warningPlaceholder} className="[margin-top:6px]" /></form>
      </FormDialog>
      <ConfirmDialog open={removeOpen} onOpenChange={setRemoveOpen} title={t.removeTitle} description={t.removeDescription} destructive onConfirm={() => { showToast(t.listingRemoved); setRemoveOpen(false) }} />
      <ConfirmDialog open={suspendOpen} onOpenChange={setSuspendOpen} title={t.suspendTitle} description={t.suspendDescription} destructive onConfirm={() => { showToast(t.accountSuspended); setSuspendOpen(false) }} />
      <ConfirmDialog open={dismissOpen} onOpenChange={setDismissOpen} title={t.dismissTitle} description={t.dismissDescription} onConfirm={() => { if (selected) dismissMutation.mutate(selected.id); setDismissOpen(false) }} />
    </div>
  )
}
