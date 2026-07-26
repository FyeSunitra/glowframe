'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Truck, MoreHorizontal, Copy } from 'lucide-react'
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { useMenuI18n } from '@/hooks/useMenuI18n'

interface Delivery { id: number; bookingNo: string; camera: string; direction: string; carrier: string; trackingNo: string; renterAddress: string; expected: string; lastEvent: string; status: string }

const CARRIER_OPTIONS = [{ value: '', label: 'All carriers' }, { value: 'grab', label: 'Grab' }, { value: 'thailand-post', label: 'Thailand Post' }, { value: 'kerry', label: 'Kerry Express' }, { value: 'flash', label: 'Flash Express' }, { value: 'other', label: 'Other' }]
const DIRECTION_OPTIONS = [{ value: '', label: 'All directions' }, { value: 'outbound', label: 'Outbound' }, { value: 'return', label: 'Return' }]
const TABS = ['Active', 'Delivered', 'Issues']

const trackingSchema = z.object({ trackingNo: z.string().min(1) })
const issueSchema = z.object({ issueType: z.string().min(1), note: z.string().optional() })
type TrackingForm = z.infer<typeof trackingSchema>
type IssueForm = z.infer<typeof issueSchema>

const MOCK_EVENTS = [
  { event: 'Package picked up by driver', date: '12 Jul 2026 09:00' },
  { event: 'In transit — Bangkok hub', date: '12 Jul 2026 12:30' },
  { event: 'Out for delivery', date: '12 Jul 2026 15:00' },
  { event: 'Delivered to recipient', date: '12 Jul 2026 16:45' },
]

export default function DeliveryPage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('Active')
  const [search, setSearch] = useState('')
  const [carrierFilter, setCarrierFilter] = useState('')
  const [directionFilter, setDirectionFilter] = useState('')
  const [selected, setSelected] = useState<Delivery | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)
  const [deliveredId, setDeliveredId] = useState<number | null>(null)

  const tab = activeTab.toLowerCase()
  const filters = { tab, search, carrier: carrierFilter, direction: directionFilter }
  const { data: deliveries = [], isLoading } = useQuery<Delivery[]>({
    queryKey: ['admin', 'operations', 'delivery', filters],
    queryFn: () => axios.get('/api/admin/operations/delivery', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'operations', 'delivery'] })
  const markDeliveredMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/operations/delivery/${id}`, { action: 'mark-delivered' }), onSuccess: () => { invalidate(); showToast(tr('Marked as delivered')) } })
  const trackingForm = useForm<TrackingForm>({ resolver: zodResolver(trackingSchema) })
  const issueForm = useForm<IssueForm>({ resolver: zodResolver(issueSchema), defaultValues: { issueType: 'lost' } })

  const COLUMNS = [
    { key: 'bookingNo', header: 'Booking #', render: (r: Delivery) => r.bookingNo },
    { key: 'camera', header: 'Camera', render: (r: Delivery) => r.camera },
    { key: 'direction', header: 'Direction', render: (r: Delivery) => <StatusBadge status={r.direction === 'outbound' ? 'active' : 'pending'} /> },
    { key: 'carrier', header: 'Carrier', render: (r: Delivery) => r.carrier },
    { key: 'trackingNo', header: 'Tracking #', render: (r: Delivery) => (
      <span className="flex items-center gap-[6px]">
        <span className="font-[var(--font-poppins)] text-[12px]">{r.trackingNo}</span>
        <button onClick={() => { navigator.clipboard.writeText(r.trackingNo); showToast(tr('Copied!')) }} className="bg-transparent border-0 cursor-pointer [padding:2px]"><Copy size={12} /></button>
      </span>
    )},
    { key: 'renterAddress', header: 'Renter address', render: (r: Delivery) => <span className="text-[12.5px] text-gf-muted">{r.renterAddress.slice(0, 35)}{r.renterAddress.length > 35 ? '…' : ''}</span> },
    { key: 'expected', header: 'Expected', render: (r: Delivery) => <span className="text-[12.5px] text-gf-muted">{r.expected}</span> },
    { key: 'lastEvent', header: 'Last event', render: (r: Delivery) => <span className="text-[12.5px]">{r.lastEvent}</span> },
    { key: 'status', header: 'Status', render: (r: Delivery) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: Delivery) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>{tr('View')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); trackingForm.reset({ trackingNo: r.trackingNo }); setTrackingOpen(true) }}>{tr('Update tracking #')}</DropdownMenuItem>
          {r.status !== 'delivered' && <DropdownMenuItem onClick={() => setDeliveredId(r.id)}>{tr('Mark delivered')}</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onClick={() => { setSelected(r); issueForm.reset(); setIssueOpen(true) }}>{tr('Flag as issue')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Operations', 'Delivery']} title="Delivery Tracking" />
      <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />
      <FilterBar
        search={{ placeholder: 'Search booking or tracking #…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Carrier', value: carrierFilter, onChange: setCarrierFilter, options: CARRIER_OPTIONS },
          { label: 'Direction', value: directionFilter, onChange: setDirectionFilter, options: DIRECTION_OPTIONS },
        ]}
      />
      <DataTable columns={COLUMNS} data={deliveries} loading={isLoading} empty={<EmptyState icon={Truck} heading="No active deliveries" sub="Active shipments appear here." />} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? `${selected.bookingNo} — ${selected.direction}` : ''}
        footer={
          <div className="flex gap-[10px]">
            <button className="flex-1 [border:1.5px_solid_var(--gf-red)] bg-transparent text-gf-red rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => { setDrawerOpen(false); issueForm.reset(); setIssueOpen(true) }}>{tr('Flag as issue')}</button>
            {selected?.status !== 'delivered' && <button className="flex-1 bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => { setDrawerOpen(false); setDeliveredId(selected!.id) }}>{tr('Mark delivered')}</button>}
          </div>
        }
      >
        {selected && (
          <div>
            {[{ label: 'Camera', value: selected.camera }, { label: 'Carrier', value: selected.carrier }, { label: 'Tracking #', value: selected.trackingNo }, { label: 'Address', value: selected.renterAddress }, { label: 'Expected', value: selected.expected }].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{tr(r.label)}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:20px]">
              <div className="text-[14px] font-semibold text-gf-brown-900 [margin-bottom:12px]">{tr('Tracking events')}</div>
              {MOCK_EVENTS.map((e, i) => (
                <div key={i} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                  <span>{e.event}</span>
                  <span className="text-gf-muted text-[12px]">{e.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>

      <FormDialog open={trackingOpen} onOpenChange={setTrackingOpen} title="Update Tracking Number" submitLabel="Update" onSubmit={trackingForm.handleSubmit(() => { showToast(tr('Tracking number updated')); setTrackingOpen(false) })}>
        <form><Label>Tracking number</Label><Input {...trackingForm.register('trackingNo')} className="[margin-top:6px] font-[var(--font-poppins)]" /></form>
      </FormDialog>

      <FormDialog open={issueOpen} onOpenChange={setIssueOpen} title="Flag as Issue" submitLabel="Flag" onSubmit={issueForm.handleSubmit(() => { showToast(tr('Flagged as issue')); setIssueOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div>
            <Label>Issue type</Label>
            <Select value={issueForm.watch('issueType')} onValueChange={v => issueForm.setValue('issueType', v ?? 'lost')}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lost">Lost in transit</SelectItem>
                <SelectItem value="damaged">Damaged in transit</SelectItem>
                <SelectItem value="wrong-address">Wrong address</SelectItem>
                <SelectItem value="refused">Delivery refused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea {...issueForm.register('note')} className="[margin-top:6px]" /></div>
        </form>
      </FormDialog>

      <ConfirmDialog open={deliveredId !== null} onOpenChange={open => { if (!open) setDeliveredId(null) }} title="Mark as delivered?" description="The shipment status will be updated to delivered." onConfirm={() => { if (deliveredId !== null) markDeliveredMutation.mutate(deliveredId); setDeliveredId(null) }} />
    </div>
  )
}
