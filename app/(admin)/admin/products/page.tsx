'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Camera, MoreHorizontal, Play } from 'lucide-react'
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
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog'
import { CameraGlyph } from '@/components/common/CameraGlyph'
import { ProductMediaLightbox } from '@/components/features/products/ProductMediaLightbox'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/admin/shared/Field'
import { cn, money } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'
import { unwrapApiResponse } from '@/lib/api'
import { adminProductService } from '@/services/adminProducts'
import type { AdminProduct } from '@/types/adminProduct'

const listingSchema = z.object({
  name: z.string().min(1),
  desc: z.string().min(1),
  extra: z.string().optional(),
  price: z.number().min(1),
  deposit: z.number().min(0),
})
type ListingForm = z.infer<typeof listingSchema>
type RejectForm = { reason: string }

function ProductRowActions({ row, labels, onApprove, onReject, onEdit, onArchive, onDelete }: {
  row: AdminProduct
  labels: { approve: string; reject: string; edit: string; archive: string; delete: string }
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
        {row.status === 'pending' && <DropdownMenuItem onClick={() => onApprove(row)}>{labels.approve}</DropdownMenuItem>}
        {row.status === 'pending' && <DropdownMenuItem onClick={() => onReject(row)}>{labels.reject}</DropdownMenuItem>}
        <DropdownMenuItem onClick={() => onEdit(row)}>{labels.edit}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onArchive(row)}>{labels.archive}</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(row)}>{labels.delete}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ProductsPage() {
  const t = getPageText(useAppStore((s) => s.locale), 'adminProducts')
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priceFilter, setPriceFilter] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mediaPreviewIndex, setMediaPreviewIndex] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AdminProduct | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AdminProduct | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ label: string; destructive: boolean; onConfirm: () => void } | null>(null)

  const filters = { search, status: statusFilter, price: priceFilter }

  const { data: products = [], isLoading } = useQuery<AdminProduct[]>({
    queryKey: ['admin', 'products', filters],
    queryFn: async () => unwrapApiResponse(await adminProductService.list(filters)),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })

  const approveMutation = useMutation({
    mutationFn: async (id: number) =>
      unwrapApiResponse(await adminProductService.update(id, { action: 'approve' })),
    onSuccess: () => { invalidate(); showToast(t.approvedToast) },
  })
  const archiveMutation = useMutation({
    mutationFn: async (id: number) =>
      unwrapApiResponse(await adminProductService.update(id, { action: 'archive' })),
    onSuccess: () => { invalidate(); showToast(t.archivedToast) },
  })
  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      unwrapApiResponse(await adminProductService.remove(id)),
    onSuccess: () => { invalidate(); showToast(t.deletedToast) },
  })
  const saveMutation = useMutation({
    mutationFn: async (payload: ListingForm & { id: number }) => {
      const { id, ...body } = payload
      return unwrapApiResponse(await adminProductService.update(id, body))
    },
    onSuccess: () => { invalidate(); showToast(t.savedToast) },
  })
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
      unwrapApiResponse(
        await adminProductService.update(id, { action: 'reject', reason }),
      ),
    onSuccess: () => { invalidate(); showToast(t.rejectedToast) },
  })

  const listingForm = useForm<ListingForm>({ resolver: zodResolver(listingSchema) })
  const rejectSchema = z.object({ reason: z.string().trim().min(1, t.reasonRequired) })
  const rejectForm = useForm<RejectForm>({ resolver: zodResolver(rejectSchema) })
  const statusOptions = [
    { value: '', label: t.allStatuses },
    { value: 'pending', label: t.pending },
    { value: 'active', label: t.active },
    { value: 'rejected', label: t.rejected },
    { value: 'archived', label: t.archived },
  ]
  const priceOptions = [
    { value: '', label: t.allPrices },
    { value: 'under500', label: t.under500 },
    { value: '500-1500', label: t.betweenPrice },
    { value: 'above1500', label: t.above1500 },
  ]

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

  async function openProductDetail(row: AdminProduct) {
    setSelectedProduct(row)
    setDrawerOpen(true)
    const response = await adminProductService.get(row.id)
    if (response.success) setSelectedProduct(response.data)
  }

  const COLUMNS = [
    { key: 'camera', header: t.camera, render: (row: AdminProduct) => {
      const mainImage = row.media.find((item) => item.mediaType === 'image')
      return (
        <span className="flex cursor-pointer items-center gap-2.5" onClick={() => openProductDetail(row)}>
          <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-gf-pink-100">
            {mainImage ? (
              <Image
                src={mainImage.url}
                alt={row.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <CameraGlyph size={28} color={row.color} />
            )}
          </span>
          <span className="font-semibold text-[13px]">{row.name}</span>
        </span>
      )
    }},
    { key: 'owner', header: t.owner, render: (row: AdminProduct) => row.owner.displayName },
    { key: 'price', header: t.pricePerDay, render: (row: AdminProduct) => `${money(row.price)} THB` },
    { key: 'deposit', header: t.deposit, render: (row: AdminProduct) => `${money(row.deposit)} THB` },
    { key: 'rating', header: t.rating, render: (row: AdminProduct) => (
      <span className="text-gf-yellow text-[13px]">{'★'.repeat(row.rating)}</span>
    )},
    { key: 'bookings', header: t.bookings, render: (row: AdminProduct) => row.bookingCount },
    { key: 'status', header: t.status, render: (row: AdminProduct) => <StatusBadge status={row.status} /> },
    { key: 'created', header: t.created, render: (row: AdminProduct) => row.createdAt },
    { key: 'actions', header: '', render: (row: AdminProduct) => (
      <ProductRowActions
        row={row}
        labels={t}
        onApprove={(r) => openConfirm(t.approveTitle, false, () => { approveMutation.mutate(r.id); setConfirmOpen(false) })}
        onReject={openReject}
        onEdit={openEdit}
        onArchive={(r) => openConfirm(t.archiveTitle, false, () => { archiveMutation.mutate(r.id); setConfirmOpen(false) })}
        onDelete={setDeleteTarget}
      />
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', t.title]}
        title={t.title}
      />

      <FilterBar
        search={{ placeholder: t.search, value: search, onChange: setSearch }}
        selects={[
          { label: t.status, value: statusFilter, onChange: setStatusFilter, options: statusOptions },
          { label: t.priceRange, value: priceFilter, onChange: setPriceFilter, options: priceOptions },
        ]}
      />

      <DataTable
        columns={COLUMNS}
        data={products}
        loading={isLoading}
        empty={<EmptyState icon={Camera} heading={t.noListings} sub={t.noListingsSub} />}
      />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selectedProduct?.name ?? ''} subtitle={selectedProduct?.owner.displayName}>
        {selectedProduct && (
          <div>
            {selectedProduct.media.length > 0 ? (
              <div className="mb-5 grid grid-cols-2 gap-2">
                {selectedProduct.media.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setMediaPreviewIndex(index)}
                    className={cn(
                      'relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-[8px] border border-gf-line bg-white p-0',
                      index === 0 && 'col-span-2',
                    )}
                  >
                    {item.mediaType === 'image' ? (
                      <Image
                        src={item.url}
                        alt={`${selectedProduct.name} ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 420px"
                        className="object-contain"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center bg-black text-white">
                        <Play size={30} fill="currentColor" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div
                className="mb-5 flex h-[140px] items-center justify-center rounded-[8px]"
                style={{ background: `${selectedProduct.color}20` }}
              >
                <CameraGlyph color={selectedProduct.color} size={80} />
              </div>
            )}
            <p className="text-[13.5px] text-gf-brown-700 [margin-bottom:20px] [line-height:1.6]">{selectedProduct.desc}</p>
            {[
              { label: t.owner, value: selectedProduct.owner.displayName },
              { label: t.ownerEmail, value: selectedProduct.owner.email },
              { label: t.category, value: selectedProduct.categoryName },
              { label: t.brand, value: selectedProduct.brandName },
              { label: t.model, value: selectedProduct.model },
              { label: t.serialNumber, value: selectedProduct.serialNumber ?? '-' },
              { label: t.condition, value: selectedProduct.conditionNote ?? '-' },
              { label: t.pickupPoint, value: selectedProduct.pickupAddress },
              {
                label: t.accessories,
                value:
                  selectedProduct.accessories
                    .map((item) => `${item.name} x${item.quantity}`)
                    .join(', ') || '-',
              },
              { label: t.pricePerDay, value: `${money(selectedProduct.price)} THB` },
              { label: t.deposit, value: `${money(selectedProduct.deposit)} THB` },
              { label: t.bookings, value: selectedProduct.bookingCount },
              { label: t.rating, value: '★'.repeat(selectedProduct.rating), yellow: true },
            ].map(r => (
              <div key={r.label} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-b border-gf-line py-3 text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className={cn('break-words font-semibold text-gf-brown-900', r.yellow && 'text-gf-yellow')}>{r.value}</span>
              </div>
            ))}
            {selectedProduct.extraDetails && (
              <div className="mt-5">
                <h3 className="m-0 text-sm font-semibold text-gf-brown-900">{t.extraInfo}</h3>
                <p className="mb-0 mt-2 whitespace-pre-wrap text-[13px] leading-6 text-gf-brown-700">
                  {selectedProduct.extraDetails}
                </p>
              </div>
            )}
            {selectedProduct.rejectionReason && (
              <div className="mt-5 rounded-[8px] bg-[#FAE0DA] p-4">
                <h3 className="m-0 text-sm font-semibold text-gf-red">{t.rejectionReason}</h3>
                <p className="mb-0 mt-2 text-[13px] leading-6 text-gf-brown-700">
                  {selectedProduct.rejectionReason}
                </p>
              </div>
            )}
            {selectedProduct.status === 'pending' && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    openConfirm(t.approveTitle, false, () => {
                      approveMutation.mutate(selectedProduct.id)
                      setConfirmOpen(false)
                      setDrawerOpen(false)
                    })
                  }
                  className="min-h-11 cursor-pointer rounded-full border-0 bg-gf-brown-800 px-4 text-sm font-semibold text-white"
                >
                  {t.approve}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openReject(selectedProduct)
                    setDrawerOpen(false)
                  }}
                  className="min-h-11 cursor-pointer rounded-full border border-gf-red bg-white px-4 text-sm font-semibold text-gf-red"
                >
                  {t.reject}
                </button>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
      <ProductMediaLightbox
        media={selectedProduct?.media ?? []}
        productName={selectedProduct?.name ?? ''}
        initialIndex={mediaPreviewIndex}
        onIndexChange={setMediaPreviewIndex}
        onOpenChange={(open) => { if (!open) setMediaPreviewIndex(null) }}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editTarget ? t.editTitle : t.addTitle}
        submitLabel={editTarget ? t.saveChanges : t.addSubmit}
        onSubmit={listingForm.handleSubmit((data) => {
          if (editTarget) saveMutation.mutate({ ...data, id: editTarget.id })
          setFormOpen(false)
        })}
      >
        <form className="flex flex-col gap-[14px]">
          <Field label={t.name}><Input {...listingForm.register('name')} /></Field>
          <Field label={t.description}><Textarea {...listingForm.register('desc')} /></Field>
          <Field label={t.extraInfo}><Textarea {...listingForm.register('extra')} /></Field>
          <div className="grid [grid-template-columns:1fr_1fr] gap-[12px]">
            <Field label={t.priceThb}><Input type="number" {...listingForm.register('price', { valueAsNumber: true })} /></Field>
            <Field label={t.depositThb}><Input type="number" {...listingForm.register('deposit', { valueAsNumber: true })} /></Field>
          </div>
        </form>
      </FormDialog>

      <FormDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t.rejectTitle}
        submitLabel={t.reject}
        onSubmit={rejectForm.handleSubmit((data) => {
          if (rejectTarget) rejectMutation.mutate({ id: rejectTarget.id, reason: data.reason })
          setRejectOpen(false)
        })}
      >
        <form>
          <Field label={t.reason}>
            <Textarea {...rejectForm.register('reason')} placeholder={t.reasonPlaceholder} />
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
        description={t.cannotUndo}
        destructive={confirmAction?.destructive}
        onConfirm={() => { confirmAction?.onConfirm(); setConfirmOpen(false) }}
      />
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
