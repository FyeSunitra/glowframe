'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { CalendarCheck, MoreHorizontal } from 'lucide-react'
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
import { CameraGlyph } from '@/components/common/CameraGlyph'
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn, money } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { WalletTransaction } from '@/types'

interface AdminBooking {
  id: number
  bookingNo: string
  camera: { name: string; color: string }
  renter: { displayName: string; email: string }
  owner: { displayName: string; email: string }
  days: number
  delivery: string
  rentalFee: number
  deliveryFee: number
  discount: number
  total: number
  startDate: string
  endDate: string
  paymentMethod: string
  status: string
  createdAt: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
]
const DELIVERY_OPTIONS = [
  { value: '', label: 'All delivery' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'grab', label: 'Grab' },
  { value: 'post', label: 'Post' },
]

const changeStatusSchema = z.object({
  status: z.string().min(1),
  note: z.string().optional(),
})
type ChangeStatusForm = z.infer<typeof changeStatusSchema>

export default function BookingsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [selected, setSelected] = useState<AdminBooking | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const filters = { search, status: statusFilter, delivery: deliveryFilter }

  const { data: bookings = [], isLoading } = useQuery<AdminBooking[]>({
    queryKey: ['admin', 'bookings', filters],
    queryFn: () => axios.get('/api/admin/bookings', { params: filters }).then(r => r.data.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: string; note?: string }) =>
      axios.patch(`/api/admin/bookings/${id}`, { status, note }),
    onSuccess: () => { invalidate(); showToast('Status updated') },
  })
  const cancelMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/bookings/${id}`, { action: 'cancel' }),
    onSuccess: () => { invalidate(); showToast('Booking cancelled') },
  })

  const changeForm = useForm<ChangeStatusForm>({ resolver: zodResolver(changeStatusSchema) })

  const bookingTxn: WalletTransaction[] = selected ? [
    { id: 1, name: `Booking #${selected.bookingNo}`, date: selected.createdAt, amt: selected.total, status: selected.status },
  ] : []

  const COLUMNS = [
    { key: 'bookingNo', header: 'Booking #', render: (row: AdminBooking) => (
      <span className="font-[var(--font-poppins)] font-semibold text-[13px]">{row.bookingNo}</span>
    )},
    { key: 'camera', header: 'Camera', render: (row: AdminBooking) => (
      <span className="flex items-center gap-[8px]">
        <CameraGlyph size={28} color={row.camera.color} />
        <span className="text-[13px]">{row.camera.name}</span>
      </span>
    )},
    { key: 'renter', header: 'Renter', render: (row: AdminBooking) => row.renter.displayName },
    { key: 'owner', header: 'Owner', render: (row: AdminBooking) => row.owner.displayName },
    { key: 'days', header: 'Days', render: (row: AdminBooking) => row.days },
    { key: 'delivery', header: 'Delivery', render: (row: AdminBooking) => <span className="[text-transform:capitalize]">{row.delivery}</span> },
    { key: 'total', header: 'Total', render: (row: AdminBooking) => `${money(row.total)} THB` },
    { key: 'rentalDate', header: 'Rental date', render: (row: AdminBooking) => (
      <span className="text-[12.5px] text-gf-muted">{row.startDate} – {row.endDate}</span>
    )},
    { key: 'status', header: 'Status', render: (row: AdminBooking) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: '', render: (row: AdminBooking) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(row); setDrawerOpen(true) }}>View</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(row); changeForm.reset(); setChangeOpen(true) }}>Change status</DropdownMenuItem>
          {row.status !== 'cancelled' && (
            <DropdownMenuItem variant="destructive" onClick={() => { setSelected(row); setCancelOpen(true) }}>Cancel</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Bookings']} title="Bookings" />
      <FilterBar
        search={{ placeholder: 'Search by booking # or renter…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
          { label: 'Delivery', value: deliveryFilter, onChange: setDeliveryFilter, options: DELIVERY_OPTIONS },
        ]}
      />
      <DataTable
        columns={COLUMNS}
        data={bookings}
        loading={isLoading}
        empty={<EmptyState icon={CalendarCheck} heading="No bookings yet" sub="Bookings appear here when renters complete checkout." />}
      />

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selected ? `Booking #${selected.bookingNo}` : ''}
        subtitle={selected?.status}
        footer={
          <button className="bg-gf-red text-white border-0 rounded-full [padding:11px_22px] font-semibold cursor-pointer w-full"
            onClick={() => { setDrawerOpen(false); if (selected) setCancelOpen(true) }}>
            Cancel Booking
          </button>
        }
      >
        {selected && (
          <div>
            <div className="grid [grid-template-columns:1fr_1fr] gap-[16px] [margin-bottom:20px]">
              <div>
                <div className="text-[11px] font-semibold text-gf-muted [margin-bottom:6px] uppercase [letter-spacing:0.5px]">Renter</div>
                <div className="font-semibold text-[14px]">{selected.renter.displayName}</div>
                <div className="text-[12.5px] text-gf-muted">{selected.renter.email}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gf-muted [margin-bottom:6px] uppercase [letter-spacing:0.5px]">Camera</div>
                <span className="flex items-center gap-[8px]">
                  <CameraGlyph size={32} color={selected.camera.color} />
                  <span className="font-semibold text-[13px]">{selected.camera.name}</span>
                </span>
              </div>
            </div>
            <Separator className="[margin:0_0_16px]" />
            {[
              { label: 'Rental fee', value: `${money(selected.rentalFee)} THB` },
              { label: 'Delivery fee', value: `${money(selected.deliveryFee)} THB` },
              { label: 'Discount', value: selected.discount ? `−${money(selected.discount)} THB` : '—' },
              { label: 'Total', value: `${money(selected.total)} THB`, bold: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:9px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className={cn(r.bold ? 'font-bold' : 'font-medium')}>{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:16px]">
              {[
                { label: 'Delivery', value: selected.delivery },
                { label: 'Dates', value: `${selected.startDate} – ${selected.endDate}` },
                { label: 'Payment', value: selected.paymentMethod === 'qr' ? 'Thai QR' : 'VISA/Mastercard' },
              ].map(r => (
                <div key={r.label} className="flex justify-between [padding:9px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                  <span className="text-gf-muted">{r.label}</span>
                  <span className="font-medium [text-transform:capitalize]">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="[margin-top:20px]"><TransactionHistory items={bookingTxn} /></div>
          </div>
        )}
      </DetailDrawer>

      <FormDialog
        open={changeOpen}
        onOpenChange={setChangeOpen}
        title="Change Booking Status"
        submitLabel="Update"
        onSubmit={changeForm.handleSubmit((data) => {
          if (selected) changeStatusMutation.mutate({ id: selected.id, status: data.status, note: data.note })
          setChangeOpen(false)
        })}
      >
        <form className="flex flex-col gap-[14px]">
          <div>
            <Label>New status</Label>
            <Select value={changeForm.watch('status') ?? ''} onValueChange={(v) => changeForm.setValue('status', v ?? '')}>
              <SelectTrigger className="[margin-top:6px] rounded-full h-[40px]"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.filter(o => o.value).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea {...changeForm.register('note')} placeholder="Reason for status change…" className="[margin-top:6px]" />
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description="The booking will be marked as cancelled. This cannot be undone."
        destructive
        onConfirm={() => { if (selected) cancelMutation.mutate(selected.id); setCancelOpen(false) }}
      />
    </div>
  )
}
