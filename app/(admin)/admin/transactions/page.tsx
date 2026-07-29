'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, MoreHorizontal, QrCode } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DataTable } from '@/components/admin/shared/DataTable'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { Pagination } from '@/components/common/Pagination'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn, money } from '@/lib/utils'
import { adminTransactionService } from '@/services/adminTransactions'
import { useAppStore } from '@/store/appStore'
import type { AdminTransaction } from '@/types/adminTransaction'

type RejectForm = { reason: string }

export default function TransactionsPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminTransactions')
  const paymentText = getPageText(locale, 'myRentals').paymentStatuses
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [method, setMethod] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<AdminTransaction | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [proofOpen, setProofOpen] = useState(false)

  const filters = { search, method, status, page, limit }
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'transactions', filters],
    queryFn: () => adminTransactionService.list(filters).then(unwrapApiResponse),
  })

  const rejectSchema = z.object({
    reason: z.string().trim().min(1, t.reasonRequired),
  })
  const rejectForm = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  })

  const reviewMutation = useMutation({
    mutationFn: ({
      transaction,
      action,
      reason,
    }: {
      transaction: AdminTransaction
      action: 'approve_payment' | 'reject_payment'
      reason?: string
    }) => adminTransactionService.review(
      transaction.id,
      action === 'approve_payment'
        ? { action }
        : { action, reason: reason ?? '' },
    ).then(unwrapApiResponse),
    onSuccess: (updated) => {
      setSelected((current) => ({
        ...updated,
        proofUrl: current?.id === updated.id ? current.proofUrl : updated.proofUrl,
      }))
      void queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      showToast(t.evidenceReviewed)
    },
    onError: (error) => showToast(
      error instanceof Error ? error.message : t.reviewFailed,
    ),
  })

  const methodOptions = [
    { value: '', label: t.allMethods },
    { value: 'promptpay', label: t.thaiQr },
    { value: 'bank_transfer', label: t.bankTransfer },
  ]
  const statusOptions = [
    { value: '', label: t.allStatuses },
    ...Object.entries(paymentText).map(([value, label]) => ({ value, label })),
  ]
  const rows = data?.items ?? []
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { dateStyle: 'medium', timeStyle: 'short' },
  )

  function resetPage(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  function openReview(
    transaction: AdminTransaction,
    action: 'approve' | 'reject',
  ) {
    setSelected(transaction)
    if (action === 'approve') {
      setApproveOpen(true)
    } else {
      rejectForm.reset({ reason: '' })
      setRejectOpen(true)
    }
  }

  const columns = [
    {
      key: 'txnId',
      header: t.txnId,
      render: (row: AdminTransaction) => (
        <span className="font-[var(--font-poppins)] text-xs font-semibold">{row.txnId}</span>
      ),
    },
    { key: 'bookingNo', header: t.bookingNo, render: (row: AdminTransaction) => row.bookingNo },
    { key: 'user', header: t.user, render: (row: AdminTransaction) => row.user.displayName },
    {
      key: 'method',
      header: t.method,
      render: (row: AdminTransaction) => (
        <MethodCell method={row.method} promptPay={t.thaiQr} bank={t.bankTransfer} />
      ),
    },
    { key: 'total', header: t.total, render: (row: AdminTransaction) => `${money(row.total)} THB` },
    {
      key: 'date',
      header: t.date,
      render: (row: AdminTransaction) => (
        <span className="text-[12.5px] text-gf-muted">
          {dateFormatter.format(new Date(row.date))}
        </span>
      ),
    },
    {
      key: 'status',
      header: t.status,
      render: (row: AdminTransaction) => <StatusBadge status={row.status} />,
    },
    // {
    //   key: 'proof',
    //   header: t.paymentProof,
    //   render: (row: AdminTransaction) => (
    //     row.proofUrl ? (
    //       <span className="relative block size-11 overflow-hidden rounded-[6px] border border-gf-line bg-gf-pink-100">
    //         {/* Signed private URL; the storage path is not exposed to the UI. */}
    //         {/* eslint-disable-next-line @next/next/no-img-element */}
    //         <img
    //           src={row.proofUrl}
    //           alt={t.paymentProof}
    //           className="size-full object-cover"
    //         />
    //       </span>
    //     ) : (
    //       <ImageIcon size={20} className="text-gf-brown-300" />
    //     )
    //   ),
    // },
    {
      key: 'actions',
      header: '',
      render: (row: AdminTransaction) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t.view}
            onClick={(event) => event.stopPropagation()}
            className="cursor-pointer rounded-[8px] border-0 bg-transparent p-2 text-gf-brown-700"
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => {
              setSelected(row)
              setDrawerOpen(true)
            }}>
              {t.view}
            </DropdownMenuItem>
            {row.status === 'pendingReview' && (
              <>
                <DropdownMenuItem onClick={() => openReview(row, 'approve')}>
                  {t.approveEvidence}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => openReview(row, 'reject')}
                >
                  {t.rejectEvidence}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
      <FilterBar
        search={{
          placeholder: t.search,
          value: search,
          onChange: (value) => resetPage(setSearch, value),
        }}
        selects={[
          {
            label: t.method,
            value: method,
            onChange: (value) => resetPage(setMethod, value),
            options: methodOptions,
          },
          {
            label: t.status,
            value: status,
            onChange: (value) => resetPage(setStatus, value),
            options: statusOptions,
          },
        ]}
      />

      {isError ? (
        <EmptyState icon={CreditCard} heading={t.loadFailed} sub={t.noTransactionsSub} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            loading={isLoading}
            onRowClick={(row) => {
              setSelected(row)
              setDrawerOpen(true)
            }}
            empty={<EmptyState icon={CreditCard} heading={t.noTransactions} sub={t.noTransactionsSub} />}
          />
          {data && data.meta.total > 0 && (
            <Pagination
              {...data.meta}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value)
                setPage(1)
              }}
            />
          )}
        </>
      )}

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selected?.txnId ?? ''}
        subtitle={selected ? dateFormatter.format(new Date(selected.date)) : undefined}
        footer={selected?.status === 'pendingReview' ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="cursor-pointer rounded-full border-0 bg-gf-pink-500 px-4 py-3 font-semibold text-gf-brown-900"
              onClick={() => {
                setDrawerOpen(false)
                openReview(selected, 'approve')
              }}
            >
              {t.approveEvidence}
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-full border-0 bg-gf-red px-4 py-3 font-semibold text-white"
              onClick={() => {
                setDrawerOpen(false)
                openReview(selected, 'reject')
              }}
            >
              {t.reject}
            </button>
          </div>
        ) : undefined}
      >
        {selected && (
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <MethodCell method={selected.method} promptPay={t.thaiQr} bank={t.bankTransfer} />
              <StatusBadge status={selected.status} />
            </div>
            <DetailRow label={t.booking} value={selected.bookingNo} />
            <DetailRow label={t.user} value={`${selected.user.displayName} (${selected.user.email})`} />
            <DetailRow label={t.rental} value={`${money(selected.rentalFee)} THB`} />
            <DetailRow label={t.delivery} value={`${money(selected.deliveryFee)} THB`} />
            <DetailRow label={t.securityDeposit} value={`${money(selected.deposit)} THB`} />
            <DetailRow label={t.platformFee} value={`${money(selected.platformFee)} THB`} />
            <DetailRow label={t.total} value={`${money(selected.total)} THB`} strong />
            <button
              type="button"
              disabled={!selected.proofUrl}
              onClick={() => setProofOpen(true)}
              className="mt-5 block w-full cursor-pointer rounded-[8px] border border-gf-line bg-white p-4 text-left disabled:cursor-default"
            >
              <div className="text-xs font-semibold text-gf-muted">{t.paymentProof}</div>
              {selected.proofUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selected.proofUrl}
                    alt={t.paymentProof}
                    className="mt-3 max-h-72 w-full rounded-[6px] bg-gf-pink-100 object-contain"
                  />
                  <div className="mt-2 break-all text-xs text-gf-muted">
                    {selected.proofFileName}
                  </div>
                </>
              ) : (
                <div className="mt-2 text-sm font-medium text-gf-brown-900">
                  {selected.proofFileName ?? t.noProof}
                </div>
              )}
            </button>
            {selected.rejectionReason && (
              <div className="mt-4 rounded-[8px] bg-[#FAE0DA] p-4 text-sm text-gf-red">
                {selected.rejectionReason}
              </div>
            )}
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title={t.approveTitle}
        description={t.approveDescription}
        onConfirm={() => {
          if (selected) {
            reviewMutation.mutate({
              transaction: selected,
              action: 'approve_payment',
            })
          }
          setApproveOpen(false)
        }}
      />

      <FormDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title={t.rejectTitle}
        submitLabel={t.reject}
        onSubmit={rejectForm.handleSubmit(({ reason }) => {
          if (selected) {
            reviewMutation.mutate({
              transaction: selected,
              action: 'reject_payment',
              reason,
            })
          }
          setRejectOpen(false)
        })}
      >
        <form>
          <Label>{t.rejectionReason}</Label>
          <Textarea
            {...rejectForm.register('reason')}
            className="mt-1.5"
            placeholder={t.rejectionPlaceholder}
          />
          {rejectForm.formState.errors.reason && (
            <span className="mt-1 block text-xs text-gf-red">
              {rejectForm.formState.errors.reason.message}
            </span>
          )}
        </form>
      </FormDialog>

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[1400px] overflow-hidden rounded-[8px] border-0 bg-[#171717] p-4">
          <DialogTitle className="sr-only">{t.paymentProof}</DialogTitle>
          {selected?.proofUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={selected.proofUrl}
              alt={t.paymentProof}
              className="size-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MethodCell({
  method,
  promptPay,
  bank,
}: {
  method: AdminTransaction['method']
  promptPay: string
  bank: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      {method === 'promptpay' ? <QrCode size={15} /> : <CreditCard size={15} />}
      {method === 'promptpay' ? promptPay : bank}
    </span>
  )
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-gf-line py-2.5 text-[13px]">
      <span className="text-gf-muted">{label}</span>
      <span className={cn('text-right text-gf-brown-900', strong && 'font-bold')}>
        {value}
      </span>
    </div>
  )
}
