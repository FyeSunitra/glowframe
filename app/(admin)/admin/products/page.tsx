'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Camera, MoreHorizontal } from 'lucide-react'
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
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/admin/shared/Field'
import { cn, money } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import type { WalletTransaction } from '@/types'

interface AdminProduct {
  id: number
  name: string
  desc: string
  price: number
  deposit: number
  color: string
  rating: number
  bookingCount: number
  status: string
  createdAt: string
  owner: { id: number; displayName: string; email: string }
}

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
]
const PRICE_OPTIONS = [
  { value: '', label: 'All prices' },
  { value: 'under500', label: 'Under ฿500' },
  { value: '500-1500', label: '฿500–1,500' },
  { value: 'above1500', label: 'Above ฿1,500' },
]

const MOCK_PRODUCT_BOOKINGS: WalletTransaction[] = [
  { id: 1, name: 'Booking #123456-78', date: '12 Jul 2026', amt: 4500, status: 'paid' },
  { id: 2, name: 'Booking #112233-44', date: '28 Jun 2026', amt: 4500, status: 'paid' },
]

const listingSchema = z.object({
  name: z.string().min(1),
  desc: z.string().min(1),
  extra: z.string().optional(),
  price: z.number().min(1),
  deposit: z.number().min(0),
})
const rejectSchema = z.object({ reason: z.string().min(1, 'Reason is required') })
type ListingForm = z.infer<typeof listingSchema>
type RejectForm = z.infer<typeof rejectSchema>

function ProductRowActions({ row, onApprove, onReject, onEdit, onArchive, onDelete }: {
  row: AdminProduct
  onApprove: (row: AdminProduct) => void
  onReject: (row: AdminProduct) => void
  onEdit: (row: AdminProduct) => void
  onArchive: (row: AdminProduct) => void
  onDelete: (row: AdminProduct) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        {row.status === 'pending' && <DropdownMenuItem onClick={() => onApprove(row)}>Approve</DropdownMenuItem>}
        {row.status === 'pending' && <DropdownMenuItem onClick={() => onReject(row)}>Reject</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onArchive(row)}>Archive</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ProductsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priceFilter, setPriceFilter] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminProduct | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AdminProduct | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ label: string; destructive: boolean; onConfirm: () => void } | null>(null)

  const filters = { search, status: statusFilter, price: priceFilter }

  const { data: products = [], isLoading } = useQuery<AdminProduct[]>({
    queryKey: ['admin', 'products', filters],
    queryFn: () => axios.get('/api/admin/products', { params: filters }).then(r => r.data.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })

  const approveMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/products/${id}`, { action: 'approve' }),
    onSuccess: () => { invalidate(); showToast('Listing approved') },
  })
  const archiveMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/products/${id}`, { action: 'archive' }),
    onSuccess: () => { invalidate(); showToast('Listing archived') },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/admin/products/${id}`),
    onSuccess: () => { invalidate(); showToast('Listing deleted') },
  })
  const saveMutation = useMutation({
    mutationFn: (payload: Partial<ListingForm> & { id?: number }) => {
      const { id, ...body } = payload
      return id ? axios.patch(`/api/admin/products/${id}`, body) : axios.post('/api/admin/products', body)
    },
    onSuccess: () => { invalidate(); showToast('Listing saved') },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      axios.patch(`/api/admin/products/${id}`, { action: 'reject', reason }),
    onSuccess: () => { invalidate(); showToast('Listing rejected') },
  })

  const listingForm = useForm<ListingForm>({ resolver: zodResolver(listingSchema) })
  const rejectForm = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) })

  function openEdit(row: AdminProduct) {
    setEditTarget(row)
    listingForm.reset({ name: row.name, desc: row.desc, extra: '', price: row.price, deposit: row.deposit })
    setFormOpen(true)
  }

  function openReject(row: AdminProduct) {
    setRejectTarget(row)
    rejectForm.reset()
    setRejectOpen(true)
  }

  function openConfirm(label: string, destructive: boolean, onConfirm: () => void) {
    setConfirmAction({ label, destructive, onConfirm })
    setConfirmOpen(true)
  }

  const COLUMNS = [
    { key: 'camera', header: 'Camera', render: (row: AdminProduct) => (
      <span className="flex items-center gap-[10px] cursor-pointer" onClick={() => { setSelectedProduct(row); setDrawerOpen(true) }}>
        <CameraGlyph size={32} color={row.color} />
        <span className="font-semibold text-[13px]">{row.name}</span>
      </span>
    )},
    { key: 'owner', header: 'Owner', render: (row: AdminProduct) => row.owner.displayName },
    { key: 'price', header: 'Price/day', render: (row: AdminProduct) => `${money(row.price)} THB` },
    { key: 'deposit', header: 'Deposit', render: (row: AdminProduct) => `${money(row.deposit)} THB` },
    { key: 'rating', header: 'Rating', render: (row: AdminProduct) => (
      <span className="text-gf-yellow text-[13px]">{'★'.repeat(row.rating)}</span>
    )},
    { key: 'bookings', header: 'Bookings', render: (row: AdminProduct) => row.bookingCount },
    { key: 'status', header: 'Status', render: (row: AdminProduct) => <StatusBadge status={row.status} /> },
    { key: 'created', header: 'Created', render: (row: AdminProduct) => row.createdAt },
    { key: 'actions', header: '', render: (row: AdminProduct) => (
      <ProductRowActions
        row={row}
        onApprove={(r) => openConfirm('Approve this listing?', false, () => { approveMutation.mutate(r.id); setConfirmOpen(false) })}
        onReject={openReject}
        onEdit={openEdit}
        onArchive={(r) => openConfirm('Archive this listing?', false, () => { archiveMutation.mutate(r.id); setConfirmOpen(false) })}
        onDelete={(r) => openConfirm('Permanently delete this listing?', true, () => { deleteMutation.mutate(r.id); setConfirmOpen(false) })}
      />
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Camera Listings']}
        title="Camera Listings"
        action={
          <button
            onClick={() => { setEditTarget(null); listingForm.reset(); setFormOpen(true) }}
            className="[border:1.5px_solid_var(--gf-brown-300)] text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold bg-transparent cursor-pointer"
          >
            + Add listing
          </button>
        }
      />

      <FilterBar
        search={{ placeholder: 'Search by camera name or owner…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
          { label: 'Price range', value: priceFilter, onChange: setPriceFilter, options: PRICE_OPTIONS },
        ]}
      />

      <DataTable
        columns={COLUMNS}
        data={products}
        loading={isLoading}
        empty={<EmptyState icon={Camera} heading="No listings yet" sub="Listings appear here when owners add cameras." />}
      />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selectedProduct?.name ?? ''} subtitle={selectedProduct?.owner.displayName}>
        {selectedProduct && (
          <div>
            <div className="mb-5 flex h-[140px] items-center justify-center rounded-[16px]" style={{ background: `${selectedProduct.color}20` }}>
              <CameraGlyph color={selectedProduct.color} size={80} />
            </div>
            <p className="text-[13.5px] text-gf-brown-700 [margin-bottom:20px] [line-height:1.6]">{selectedProduct.desc}</p>
            {[
              { label: 'Owner', value: selectedProduct.owner.displayName },
              { label: 'Price / day', value: `${money(selectedProduct.price)} THB` },
              { label: 'Deposit', value: `${money(selectedProduct.deposit)} THB` },
              { label: 'Rating', value: '★'.repeat(selectedProduct.rating), yellow: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:12px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className={cn('font-semibold', r.yellow && 'text-gf-yellow')}>{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:24px] text-[14px] font-semibold text-gf-brown-900 [margin-bottom:12px]">Recent Bookings</div>
            <TransactionHistory items={MOCK_PRODUCT_BOOKINGS} />
          </div>
        )}
      </DetailDrawer>

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editTarget ? 'Edit Listing' : 'Add Listing'}
        submitLabel={editTarget ? 'Save changes' : 'Add listing'}
        onSubmit={listingForm.handleSubmit((data) => {
          saveMutation.mutate({ ...data, id: editTarget?.id })
          setFormOpen(false)
        })}
      >
        <form className="flex flex-col gap-[14px]">
          <Field label="Name"><Input {...listingForm.register('name')} /></Field>
          <Field label="Description"><Textarea {...listingForm.register('desc')} /></Field>
          <Field label="Extra info"><Textarea {...listingForm.register('extra')} /></Field>
          <div className="grid [grid-template-columns:1fr_1fr] gap-[12px]">
            <Field label="Price / day (THB)"><Input type="number" {...listingForm.register('price', { valueAsNumber: true })} /></Field>
            <Field label="Deposit (THB)"><Input type="number" {...listingForm.register('deposit', { valueAsNumber: true })} /></Field>
          </div>
        </form>
      </FormDialog>

      <FormDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Listing"
        submitLabel="Reject"
        onSubmit={rejectForm.handleSubmit((data) => {
          if (rejectTarget) rejectMutation.mutate({ id: rejectTarget.id, reason: data.reason })
          setRejectOpen(false)
        })}
      >
        <form>
          <Field label="Reason for rejection">
            <Textarea {...rejectForm.register('reason')} placeholder="Explain why this listing is being rejected…" />
          </Field>
          {rejectForm.formState.errors.reason && (
            <span className="text-[12px] text-gf-red [margin-top:4px] block">
              {rejectForm.formState.errors.reason.message}
            </span>
          )}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmAction?.label ?? ''}
        description="This action cannot be undone."
        destructive={confirmAction?.destructive}
        onConfirm={() => { confirmAction?.onConfirm(); setConfirmOpen(false) }}
      />
    </div>
  )
}
