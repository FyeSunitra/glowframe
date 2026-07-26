'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Tag, MoreHorizontal } from 'lucide-react'
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { money } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useMenuI18n } from '@/hooks/useMenuI18n'

interface Promo { id: number; code: string; type: string; value: number; minBookingValue: number | null; used: number; limit: number | null; expires: string | null; status: string }

const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'scheduled', label: 'Scheduled' }, { value: 'disabled', label: 'Disabled' }]
const TYPE_OPTIONS = [{ value: '', label: 'All types' }, { value: 'flat', label: 'Flat (฿)' }, { value: 'percentage', label: 'Percentage (%)' }]

const promoSchema = z.object({
  code: z.string().min(4).max(20),
  type: z.string().min(1),
  value: z.number().min(1),
  minBookingValue: z.number().optional(),
  maxUses: z.number().optional(),
  appliesTo: z.string().min(1),
})
type PromoForm = z.infer<typeof promoSchema>

export default function PromotionsPage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editTarget, setEditTarget] = useState<Promo | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [disableId, setDisableId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filters = { search, status: statusFilter, type: typeFilter }
  const { data: promos = [], isLoading } = useQuery<Promo[]>({
    queryKey: ['admin', 'financial', 'promotions', filters],
    queryFn: () => axios.get('/api/admin/financial/promotions', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'financial', 'promotions'] })
  const saveMutation = useMutation({
    mutationFn: (data: Partial<PromoForm> & { id?: number }) => {
      const { id, ...body } = data
      return id ? axios.patch(`/api/admin/financial/promotions/${id}`, body) : axios.post('/api/admin/financial/promotions', body)
    },
    onSuccess: () => { invalidate(); showToast(tr('Promo code saved')) },
  })
  const disableMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/financial/promotions/${id}`, { status: 'disabled' }), onSuccess: () => { invalidate(); showToast(tr('Code disabled')) } })
  const deleteMutation = useMutation({ mutationFn: (id: number) => axios.delete(`/api/admin/financial/promotions/${id}`), onSuccess: () => { invalidate(); showToast(tr('Code deleted')) } })

  const form = useForm<PromoForm>({ resolver: zodResolver(promoSchema), defaultValues: { type: 'percentage', appliesTo: 'all' } })

  const COLUMNS = [
    { key: 'code', header: 'Code', render: (r: Promo) => <span className="font-[var(--font-poppins)] font-bold [letter-spacing:0.5px]">{r.code}</span> },
    { key: 'type', header: 'Type', render: (r: Promo) => r.type === 'flat' ? 'Flat (฿)' : 'Percentage (%)' },
    { key: 'value', header: 'Value', render: (r: Promo) => r.type === 'flat' ? `${money(r.value)} THB` : `${r.value}%` },
    { key: 'minBooking', header: 'Min booking', render: (r: Promo) => r.minBookingValue ? `${money(r.minBookingValue)} THB` : '—' },
    { key: 'uses', header: 'Used / Limit', render: (r: Promo) => `${r.used} / ${r.limit ?? '∞'}` },
    { key: 'expires', header: 'Expires', render: (r: Promo) => r.expires ?? 'No expiry' },
    { key: 'status', header: 'Status', render: (r: Promo) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: Promo) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setEditTarget(r); form.reset({ code: r.code, type: r.type, value: r.value, appliesTo: 'all' }); setFormOpen(true) }}>{tr('Edit')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(r.code); showToast(tr('Code copied!')) }}>{tr('Copy code')}</DropdownMenuItem>
          {r.status === 'active' && <DropdownMenuItem onClick={() => setDisableId(r.id)}>{tr('Disable')}</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(r.id)}>{tr('Delete')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Financial', 'Promotions']}
        title="Promotions"
        action={<button onClick={() => { setEditTarget(null); form.reset({ type: 'percentage', appliesTo: 'all' }); setFormOpen(true) }} className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">{tr('+ Create code')}</button>}
      />
      <FilterBar
        search={{ placeholder: 'Search promo code…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
          { label: 'Type', value: typeFilter, onChange: setTypeFilter, options: TYPE_OPTIONS },
        ]}
      />
      <DataTable columns={COLUMNS} data={promos} loading={isLoading} empty={<EmptyState icon={Tag} heading="No promo codes created" sub="Discount codes appear here once you create them." />} />

      <FormDialog open={formOpen} onOpenChange={setFormOpen} title={editTarget ? 'Edit Code' : 'Create Code'} submitLabel={editTarget ? 'Save changes' : 'Create'} onSubmit={form.handleSubmit(data => { saveMutation.mutate({ ...data, id: editTarget?.id }); setFormOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div><Label>Code</Label><Input {...form.register('code')} placeholder="SUMMER20" className="[margin-top:6px] uppercase" /></div>
          <div>
            <Label>Discount type</Label>
            <Select value={form.watch('type')} onValueChange={v => form.setValue('type', v ?? 'flat')}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat (฿ X off)</SelectItem>
                <SelectItem value="percentage">Percentage (X% off)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid [grid-template-columns:1fr_1fr] gap-[12px]">
            <div><Label>Value</Label><Input type="number" {...form.register('value', { valueAsNumber: true })} className="[margin-top:6px]" /></div>
            <div><Label>Min booking (THB)</Label><Input type="number" {...form.register('minBookingValue', { valueAsNumber: true })} className="[margin-top:6px]" /></div>
          </div>
          <div><Label>Max uses (blank = unlimited)</Label><Input type="number" {...form.register('maxUses', { valueAsNumber: true })} className="[margin-top:6px]" /></div>
          <div>
            <Label>Applies to</Label>
            <Select value={form.watch('appliesTo')} onValueChange={v => form.setValue('appliesTo', v ?? 'all')}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="renters">Renters only</SelectItem>
                <SelectItem value="first-booking">First booking only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog open={disableId !== null} onOpenChange={open => { if (!open) setDisableId(null) }} title="Disable this code?" description="The code will no longer be accepted at checkout." onConfirm={() => { if (disableId !== null) disableMutation.mutate(disableId); setDisableId(null) }} />
      <ConfirmDeleteDialog open={deleteId !== null} onOpenChange={open => { if (!open) setDeleteId(null) }} pending={deleteMutation.isPending} onConfirm={() => { if (deleteId !== null) deleteMutation.mutate(deleteId); setDeleteId(null) }} />
    </div>
  )
}
