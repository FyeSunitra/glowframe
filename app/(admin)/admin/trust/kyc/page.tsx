'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageOff, MoreHorizontal, ShieldCheck, ZoomIn } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DataTable } from '@/components/admin/shared/DataTable'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { adminKycService } from '@/services/adminKyc'
import { useAppStore } from '@/store/appStore'
import type { AdminKycRequest, AdminKycStatus } from '@/types/adminKyc'

type RejectForm = { reason: string }

export default function KYCPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminKyc')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminKycStatus | ''>('')
  const [selected, setSelected] = useState<AdminKycRequest | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'trust', 'kyc', search, statusFilter],
    queryFn: async () =>
      unwrapApiResponse(
        await adminKycService.list({ search, status: statusFilter }),
      ),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'trust', 'kyc'] })

  const approveMutation = useMutation({
    mutationFn: async (id: string) =>
      unwrapApiResponse(await adminKycService.review(id, { action: 'approve' })),
    onSuccess: () => {
      void invalidate()
      setDrawerOpen(false)
      showToast(t.verifiedToast)
    },
    onError: (error) => showToast(error.message || t.reviewFailed),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) =>
      unwrapApiResponse(
        await adminKycService.review(id, { action: 'reject', reason }),
      ),
    onSuccess: () => {
      void invalidate()
      setDrawerOpen(false)
      showToast(t.rejectedToast)
    },
    onError: (error) => showToast(error.message || t.reviewFailed),
  })

  const rejectSchema = z.object({
    reason: z.string().trim().min(1, t.required),
  })
  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  })

  const statusOptions = [
    { value: '', label: t.all },
    { value: 'pending', label: t.pending },
    { value: 'approved', label: t.approved },
    { value: 'rejected', label: t.rejected },
  ]

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))

  function openReview(item: AdminKycRequest) {
    setSelected(item)
    setDrawerOpen(true)
  }

  const columns = [
    {
      key: 'user',
      header: t.user,
      render: (item: AdminKycRequest) => (
        <button
          type="button"
          onClick={() => openReview(item)}
          className="border-0 bg-transparent p-0 text-left"
        >
          <span className="block text-[13px] font-semibold">{item.user.displayName}</span>
          <span className="block text-[12px] text-gf-muted">{item.user.email}</span>
        </button>
      ),
    },
    {
      key: 'documentType',
      header: t.documentType,
      render: () => t.nationalId,
    },
    {
      key: 'submitted',
      header: t.submitted,
      render: (item: AdminKycRequest) => (
        <span className="text-[12.5px] text-gf-muted">
          {formatDate(item.submittedAt)}
        </span>
      ),
    },
    // {
    //   key: 'retries',
    //   header: t.retries,
    //   render: (item: AdminKycRequest) => item.retryCount,
    // },
    {
      key: 'status',
      header: t.status,
      render: (item: AdminKycRequest) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (item: AdminKycRequest) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t.actions}
            className="cursor-pointer rounded-[8px] border-0 bg-transparent px-2 py-1 text-gf-brown-700"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => openReview(item)}>
              {t.review}
            </DropdownMenuItem>
            {item.status === 'pending' ? (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setSelected(item)
                    setApproveOpen(true)
                  }}
                >
                  {t.approve}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setSelected(item)
                    rejectForm.reset({ reason: '' })
                    setRejectOpen(true)
                  }}
                >
                  {t.reject}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', t.trustSafety, t.breadcrumb]}
        title={t.title}
      />
      <FilterBar
        search={{ placeholder: t.search, value: search, onChange: setSearch }}
        selects={[
          {
            label: t.status,
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as AdminKycStatus | ''),
            options: statusOptions,
          },
        ]}
      />
      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        empty={
          <EmptyState
            icon={ShieldCheck}
            heading={t.noPending}
            sub={t.emptySub}
          />
        }
      />

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selected?.user.displayName ?? ''}
        subtitle={selected?.status}
        footer={
          selected?.status === 'pending' ? (
            <div className="flex gap-2.5">
              <button
                type="button"
                className="flex-1 rounded-full border-0 bg-gf-pink-500 py-3 font-semibold text-gf-brown-900"
                onClick={() => {
                  setDrawerOpen(false)
                  setApproveOpen(true)
                }}
              >
                {t.approve}
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border-0 bg-gf-red py-3 font-semibold text-white"
                onClick={() => {
                  setDrawerOpen(false)
                  rejectForm.reset({ reason: '' })
                  setRejectOpen(true)
                }}
              >
                {t.reject}
              </button>
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <div>
            {selected.documentUrl ? (
              <button
                type="button"
                onClick={() => setImageOpen(true)}
                className="group relative mb-5 block w-full overflow-hidden rounded-[8px] border border-gf-line bg-gf-pink-100 p-0"
              >
                {/* Signed private URL; the original storage path is never exposed here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.documentUrl}
                  alt={t.documentImage}
                  className="aspect-[1.586/1] w-full object-contain"
                />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-[12px] font-semibold text-gf-brown-900 shadow-sm">
                  <ZoomIn size={15} />
                  {t.clickToEnlarge}
                </span>
              </button>
            ) : (
              <div className="mb-5 flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[8px] bg-gf-pink-100 text-[13px] text-gf-muted">
                <ImageOff size={28} />
                {t.documentUnavailable}
              </div>
            )}

            {[
              { label: t.fullName, value: selected.legalName },
              { label: t.email, value: selected.user.email },
              { label: t.documentType, value: t.nationalId },
              { label: t.submitted, value: formatDate(selected.submittedAt) },
              // { label: t.retries, value: selected.retryCount },
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-5 border-b border-gf-line py-2.5 text-[13px]"
              >
                <span className="text-gf-muted">{row.label}</span>
                <span className="text-right font-medium">{row.value}</span>
              </div>
            ))}

            {selected.rejectionReason ? (
              <div className="mt-4 rounded-[8px] bg-[#FFF1F1] p-4 text-[13px] leading-6 text-gf-brown-800">
                <strong className="block text-gf-red">{t.reason}</strong>
                {selected.rejectionReason}
              </div>
            ) : null}
          </div>
        ) : null}
      </DetailDrawer>

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-h-[94vh] w-[min(1100px,calc(100vw-24px))] max-w-none overflow-hidden p-4 sm:max-w-none">
          <DialogHeader className="pr-10">
            <DialogTitle>{t.imagePreview}</DialogTitle>
            <DialogDescription>
              {selected?.legalName ?? selected?.user.displayName ?? ''}
            </DialogDescription>
          </DialogHeader>
          {selected?.documentUrl ? (
            <div className="flex max-h-[calc(94vh-90px)] min-h-[260px] items-center justify-center overflow-auto rounded-[8px] bg-gf-pink-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.documentUrl}
                alt={t.imagePreview}
                className="max-h-[calc(94vh-110px)] max-w-full object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title={t.approveTitle}
        description={t.approveDescription}
        onConfirm={() => {
          if (selected) approveMutation.mutate(selected.id)
          setApproveOpen(false)
        }}
      />

      <FormDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t.rejectTitle}
        submitLabel={t.reject}
        onSubmit={rejectForm.handleSubmit((data) => {
          if (selected) rejectMutation.mutate({ id: selected.id, reason: data.reason })
          setRejectOpen(false)
        })}
      >
        <form className="flex flex-col gap-3">
          <div>
            <Label>{t.reason}</Label>
            <Textarea
              {...rejectForm.register('reason')}
              placeholder={t.reasonPlaceholder}
              className="mt-1.5"
            />
            {rejectForm.formState.errors.reason ? (
              <p className="mt-1 text-[12px] text-gf-red">
                {rejectForm.formState.errors.reason.message}
              </p>
            ) : null}
          </div>
        </form>
      </FormDialog>
    </div>
  )
}
