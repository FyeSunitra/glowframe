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
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'

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

const changeStatusSchema = z.object({
  status: z.string().min(1),
  note: z.string().optional(),
})
type ChangeStatusForm = z.infer<typeof changeStatusSchema>

export default function BookingsPage() {
  const t = getPageText(useAppStore((s) => s.locale), 'adminBookings')
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
    onSuccess: () => { invalidate(); showToast(t.statusUpdated) },
  })
  const cancelMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/bookings/${id}`, { action: 'cancel' }),
    onSuccess: () => { invalidate(); showToast(t.bookingCancelled) },
  })

  const changeForm = useForm<ChangeStatusForm>({ resolver: zodResolver(changeStatusSchema) })
  const statusOptions = [
    { value: '', label: t.allStatuses },
    { value: 'pending', label: t.pending },
    { value: 'active', label: t.active },
    { value: 'cancelled', label: t.cancelled },
    { value: 'completed', label: t.completed },
  ]
  const deliveryOptions = [
    { value: '', label: t.allDelivery },
    { value: 'pickup', label: t.pickup },
    { value: 'grab', label: t.grab },
    { value: 'post', label: t.post },
  ]

  const bookingTxn: WalletTransaction[] = selected ? [
    { id: 1, name: `Booking #${selected.bookingNo}`, date: selected.createdAt, amt: selected.total, status: selected.status },
  ] : []

  const COLUMNS = [
    { key: 'bookingNo', header: t.bookingNo, render: (row: AdminBooking) => (
      <span className="font-[var(--font-poppins)] font-semibold text-[13px]">{row.bookingNo}</span>
    )},
    { key: 'camera', header: t.camera, render: (row: AdminBooking) => (
      <span className="flex items-center gap-[8px]">
        <CameraGlyph size={28} color={row.camera.color} />
        <span className="text-[13px]">{row.camera.name}</span>
      </span>
    )},
    { key: 'renter', header: t.renter, render: (row: AdminBooking) => row.renter.displayName },
    { key: 'owner', header: t.owner, render: (row: AdminBooking) => row.owner.displayName },
    { key: 'days', header: t.days, render: (row: AdminBooking) => row.days },
    { key: 'delivery', header: t.delivery, render: (row: AdminBooking) => <span className="[text-transform:capitalize]">{row.delivery}</span> },
    { key: 'total', header: t.total, render: (row: AdminBooking) => `${money(row.total)} THB` },
    { key: 'rentalDate', header: t.rentalDate, render: (row: AdminBooking) => (
      <span className="text-[12.5px] text-gf-muted">{row.startDate} – {row.endDate}</span>
    )},
    { key: 'status', header: t.status, render: (row: AdminBooking) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: '', render: (row: AdminBooking) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(row); setDrawerOpen(true) }}>{t.view}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(row); changeForm.reset(); setChangeOpen(true) }}>{t.changeStatus}</DropdownMenuItem>
          {row.status !== 'cancelled' && (
            <DropdownMenuItem variant="destructive" onClick={() => { setSelected(row); setCancelOpen(true) }}>{t.cancel}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
      <FilterBar
        search={{ placeholder: t.search, value: search, onChange: setSearch }}
        selects={[
          { label: t.status, value: statusFilter, onChange: setStatusFilter, options: statusOptions },
          { label: t.delivery, value: deliveryFilter, onChange: setDeliveryFilter, options: deliveryOptions },
        ]}
      />
      <DataTable
        columns={COLUMNS}
        data={bookings}
        loading={isLoading}
        empty={<EmptyState icon={CalendarCheck} heading={t.noBookings} sub={t.noBookingsSub} />}
      />

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selected ? `${t.bookingNo} ${selected.bookingNo}` : ''}
        subtitle={selected?.status}
        footer={
          <button className="bg-gf-red text-white border-0 rounded-full [padding:11px_22px] font-semibold cursor-pointer w-full"
            onClick={() => { setDrawerOpen(false); if (selected) setCancelOpen(true) }}>
            {t.cancelBooking}
          </button>
        }
      >
        {selected && (
          <div>
            <div className="grid [grid-template-columns:1fr_1fr] gap-[16px] [margin-bottom:20px]">
              <div>
                <div className="text-[11px] font-semibold text-gf-muted [margin-bottom:6px] uppercase [letter-spacing:0.5px]">{t.renter}</div>
                <div className="font-semibold text-[14px]">{selected.renter.displayName}</div>
                <div className="text-[12.5px] text-gf-muted">{selected.renter.email}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-gf-muted [margin-bottom:6px] uppercase [letter-spacing:0.5px]">{t.camera}</div>
                <span className="flex items-center gap-[8px]">
                  <CameraGlyph size={32} color={selected.camera.color} />
                  <span className="font-semibold text-[13px]">{selected.camera.name}</span>
                </span>
              </div>
            </div>
            <Separator className="[margin:0_0_16px]" />
            {[
              { label: t.rentalFee, value: `${money(selected.rentalFee)} THB` },
              { label: t.deliveryFee, value: `${money(selected.deliveryFee)} THB` },
              { label: t.discount, value: selected.discount ? `−${money(selected.discount)} THB` : '—' },
              { label: t.total, value: `${money(selected.total)} THB`, bold: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:9px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className={cn(r.bold ? 'font-bold' : 'font-medium')}>{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:16px]">
              {[
                { label: t.delivery, value: selected.delivery },
                { label: t.dates, value: `${selected.startDate} – ${selected.endDate}` },
                { label: t.payment, value: selected.paymentMethod === 'qr' ? t.thaiQr : t.card },
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
        title={t.changeTitle}
        submitLabel={t.update}
        onSubmit={changeForm.handleSubmit((data) => {
          if (selected) changeStatusMutation.mutate({ id: selected.id, status: data.status, note: data.note })
          setChangeOpen(false)
        })}
      >
        <form className="flex flex-col gap-[14px]">
          <div>
            <Label>{t.newStatus}</Label>
            <Select value={changeForm.watch('status') ?? ''} onValueChange={(v) => changeForm.setValue('status', v ?? '')}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder={t.selectStatus} /></SelectTrigger>
              <SelectContent>
                {statusOptions.filter(o => o.value).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t.note}</Label>
            <Textarea {...changeForm.register('note')} placeholder={t.notePlaceholder} className="[margin-top:6px]" />
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t.cancelTitle}
        description={t.cancelDescription}
        destructive
        onConfirm={() => { if (selected) cancelMutation.mutate(selected.id); setCancelOpen(false) }}
      />
    </div>
  )
}
