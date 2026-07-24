'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { PackageCheck, MoreHorizontal } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { PillTabs } from '@/components/admin/shared/PillTabs'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { CameraGlyph } from '@/components/common/CameraGlyph'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

interface PendingReturn { id: number; bookingNo: string; camera: { name: string; color: string }; renter: string; owner: string; dueDate: string; delivery: string; status: string }
interface ConditionReport { id: number; reportId: string; bookingNo: string; camera: string; condition: string; reportedBy: string; photos: number; reported: string; claimStatus: string }

const CONDITION_OPTIONS = [{ value: '', label: 'All conditions' }, { value: 'intact', label: 'Intact' }, { value: 'minor-damage', label: 'Minor damage' }, { value: 'major-damage', label: 'Major damage' }, { value: 'missing', label: 'Missing' }]
const TABS = ['Pending Returns', 'Submitted Reports']

export default function ReturnsPage() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('Pending Returns')
  const [search, setSearch] = useState('')
  const [conditionFilter, setConditionFilter] = useState('')
  const [selected, setSelected] = useState<ConditionReport | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [markReturnedId, setMarkReturnedId] = useState<number | null>(null)

  const tab = activeTab === 'Submitted Reports' ? 'reports' : 'pending'
  const filters = { tab, search, condition: conditionFilter }
  const { data: items = [], isLoading } = useQuery<(PendingReturn | ConditionReport)[]>({
    queryKey: ['admin', 'operations', 'returns', filters],
    queryFn: () => axios.get('/api/admin/operations/returns', { params: filters }).then(r => r.data.data),
  })
  const pending = items as PendingReturn[]
  const reports = items as ConditionReport[]
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'operations', 'returns'] })
  const markReturnedMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/operations/returns/${id}`, { action: 'mark-returned' }), onSuccess: () => { invalidate(); showToast('Marked as returned') } })

  const PENDING_COLS = [
    { key: 'bookingNo', header: 'Booking #', render: (r: PendingReturn) => r.bookingNo },
    { key: 'camera', header: 'Camera', render: (r: PendingReturn) => <span className="flex items-center gap-[8px]"><CameraGlyph size={28} color={r.camera.color} />{r.camera.name}</span> },
    { key: 'renter', header: 'Renter', render: (r: PendingReturn) => r.renter },
    { key: 'owner', header: 'Owner', render: (r: PendingReturn) => r.owner },
    { key: 'dueDate', header: 'Due date', render: (r: PendingReturn) => <span className={cn('font-semibold', r.status === 'overdue' && 'text-gf-red')}>{r.dueDate}</span> },
    { key: 'delivery', header: 'Delivery', render: (r: PendingReturn) => <span className="[text-transform:capitalize]">{r.delivery}</span> },
    { key: 'status', header: 'Status', render: (r: PendingReturn) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: PendingReturn) => (
      <span className="flex gap-[6px]">
        <button onClick={() => setMarkReturnedId(r.id)} className="text-[12px] [padding:4px_10px] rounded-full border-0 bg-gf-pink-500 cursor-pointer text-gf-brown-900 font-semibold">Mark returned</button>
        <button onClick={() => showToast('Flagged as late return')} className="text-[12px] [padding:4px_10px] rounded-full [border:1.5px_solid_var(--gf-brown-300)] bg-transparent cursor-pointer text-gf-brown-700">Flag late</button>
      </span>
    )},
  ]

  const REPORT_COLS = [
    { key: 'reportId', header: 'Report ID', render: (r: ConditionReport) => <span className="font-[var(--font-poppins)] font-semibold text-[12px]">{r.reportId}</span> },
    { key: 'bookingNo', header: 'Booking #', render: (r: ConditionReport) => r.bookingNo },
    { key: 'camera', header: 'Camera', render: (r: ConditionReport) => r.camera },
    { key: 'condition', header: 'Condition', render: (r: ConditionReport) => <StatusBadge status={r.condition} /> },
    { key: 'reportedBy', header: 'Reported by', render: (r: ConditionReport) => r.reportedBy },
    { key: 'photos', header: 'Photos', render: (r: ConditionReport) => r.photos },
    { key: 'reported', header: 'Reported', render: (r: ConditionReport) => <span className="text-[12.5px] text-gf-muted">{r.reported}</span> },
    { key: 'claimStatus', header: 'Claim status', render: (r: ConditionReport) => <StatusBadge status={r.claimStatus === 'none' ? 'default' : r.claimStatus} /> },
    { key: 'actions', header: '', render: (r: ConditionReport) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>View</DropdownMenuItem>
          {['minor-damage', 'major-damage', 'missing'].includes(r.condition) && <DropdownMenuItem onClick={() => showToast('Dispute opened')}>Open dispute</DropdownMenuItem>}
          <DropdownMenuItem onClick={() => showToast('Report closed')}>Close report</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  const filterBar = tab === 'reports'
    ? <FilterBar search={{ placeholder: 'Search report…', value: search, onChange: setSearch }} selects={[{ label: 'Condition', value: conditionFilter, onChange: setConditionFilter, options: CONDITION_OPTIONS }]} />
    : <FilterBar search={{ placeholder: 'Search booking…', value: search, onChange: setSearch }} />

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Operations', 'Returns']} title="Return & Condition Reports" />
      <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />
      {filterBar}
      {tab === 'pending' ? (
        <DataTable columns={PENDING_COLS} data={pending} loading={isLoading} empty={<EmptyState icon={PackageCheck} heading="No cameras due for return" sub="Reports appear here once submitted." />} />
      ) : (
        <DataTable columns={REPORT_COLS} data={reports} loading={isLoading} empty={<EmptyState icon={PackageCheck} heading="No condition reports submitted" sub="Reports appear here once submitted." />} />
      )}

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected?.reportId ?? ''} subtitle={selected?.condition}
        footer={
          selected && ['minor-damage', 'major-damage', 'missing'].includes(selected.condition) ? (
            <div className="flex gap-[10px]">
              <button className="flex-1 bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => showToast('Dispute opened')}>Open Dispute</button>
              <button className="flex-1 [border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => setDrawerOpen(false)}>Close without action</button>
            </div>
          ) : (
            <button className="w-full [border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => setDrawerOpen(false)}>Close report</button>
          )
        }
      >
        {selected && (
          <div>
            <div className="flex justify-center [margin-bottom:16px]"><StatusBadge status={selected.condition} /></div>
            {[{ label: 'Booking #', value: selected.bookingNo }, { label: 'Camera', value: selected.camera }, { label: 'Reported by', value: selected.reportedBy }, { label: 'Photos', value: `${selected.photos} photos` }, { label: 'Reported', value: selected.reported }].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:16px] grid [grid-template-columns:repeat(3,1fr)] gap-[8px]">
              {Array.from({ length: selected.photos }).map((_, i) => (
                <div key={i} className="bg-gf-pink-100 rounded-[14px] h-[80px] flex items-center justify-center text-[12px] text-gf-muted">Photo {i + 1}</div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog open={markReturnedId !== null} onOpenChange={open => { if (!open) setMarkReturnedId(null) }} title="Mark camera as returned?" description="The booking will be updated to return-complete status." onConfirm={() => { if (markReturnedId !== null) markReturnedMutation.mutate(markReturnedId); setMarkReturnedId(null) }} />
    </div>
  )
}
