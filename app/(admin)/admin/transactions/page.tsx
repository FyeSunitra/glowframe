'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { CreditCard, QrCode, MoreHorizontal } from 'lucide-react'
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
import { cn, money } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

interface AdminTransaction {
  id: number
  txnId: string
  bookingNo: string
  user: { displayName: string; email: string }
  method: string
  rentalFee: number
  deliveryFee: number
  deposit?: number
  total: number
  platformFee: number
  date: string
  status: string
  proofFile?: string
}

const METHOD_OPTIONS = [
  { value: '', label: 'All methods' },
  { value: 'qr', label: 'Thai QR' },
  { value: 'card', label: 'VISA/Mastercard' },
]
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending_review', label: 'Payment review' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
]

const refundSchema = z.object({ reason: z.string().min(1, 'Reason is required') })
type RefundForm = z.infer<typeof refundSchema>

function MethodCell({ method }: { method: string }) {
  return (
    <span className="flex items-center gap-[6px]">
      {method === 'qr' ? <QrCode size={14} /> : <CreditCard size={14} />}
      {method === 'qr' ? 'Thai QR' : 'VISA/Mastercard'}
    </span>
  )
}

export default function TransactionsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<AdminTransaction | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const filters = { search, method: methodFilter, status: statusFilter }

  const { data: transactions = [], isLoading } = useQuery<AdminTransaction[]>({
    queryKey: ['admin', 'transactions', filters],
    queryFn: () => axios.get('/api/admin/transactions', { params: filters }).then(r => r.data.data),
  })

  const refundMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      axios.post(`/api/admin/transactions/${id}/refund`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
      showToast('Refund issued')
    },
  })
  const evidenceMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'approve_payment' | 'reject_payment' }) =>
      axios.patch(`/api/admin/transactions/${id}`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'transactions'] })
      showToast('Payment evidence reviewed')
    },
  })

  const refundForm = useForm<RefundForm>({ resolver: zodResolver(refundSchema) })

  const COLUMNS = [
    { key: 'txnId', header: 'Txn ID', render: (row: AdminTransaction) => (
      <span className="font-[var(--font-poppins)] font-semibold text-[12px]">{row.txnId}</span>
    )},
    { key: 'bookingNo', header: 'Booking #', render: (row: AdminTransaction) => row.bookingNo },
    { key: 'user', header: 'User', render: (row: AdminTransaction) => row.user.displayName },
    { key: 'method', header: 'Method', render: (row: AdminTransaction) => <MethodCell method={row.method} /> },
    { key: 'rental', header: 'Rental', render: (row: AdminTransaction) => `${money(row.rentalFee)} THB` },
    { key: 'delivery', header: 'Delivery', render: (row: AdminTransaction) => `${money(row.deliveryFee)} THB` },
    { key: 'total', header: 'Total', render: (row: AdminTransaction) => `${money(row.total)} THB` },
    { key: 'platform', header: 'Platform fee', render: (row: AdminTransaction) => `${money(row.platformFee)} THB` },
    { key: 'date', header: 'Date', render: (row: AdminTransaction) => <span className="text-[12.5px] text-gf-muted">{row.date}</span> },
    { key: 'status', header: 'Status', render: (row: AdminTransaction) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: '', render: (row: AdminTransaction) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(row); setDrawerOpen(true) }}>View</DropdownMenuItem>
          {row.status === 'pending_review' && (
            <DropdownMenuItem onClick={() => evidenceMutation.mutate({ id: row.id, action: 'approve_payment' })}>Approve payment evidence</DropdownMenuItem>
          )}
          {row.status === 'pending_review' && (
            <DropdownMenuItem variant="destructive" onClick={() => evidenceMutation.mutate({ id: row.id, action: 'reject_payment' })}>Reject payment evidence</DropdownMenuItem>
          )}
          {row.status === 'paid' && (
            <DropdownMenuItem variant="destructive" onClick={() => { setSelected(row); refundForm.reset(); setRefundOpen(true) }}>Refund</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Transactions']}
        title="Transactions"
        action={
          <button className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">
            Export CSV
          </button>
        }
      />
      <FilterBar
        search={{ placeholder: 'Search by Txn ID or Booking #…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Method', value: methodFilter, onChange: setMethodFilter, options: METHOD_OPTIONS },
          { label: 'Status', value: statusFilter, onChange: setStatusFilter, options: STATUS_OPTIONS },
        ]}
      />
      <DataTable
        columns={COLUMNS}
        data={transactions}
        loading={isLoading}
        empty={<EmptyState icon={CreditCard} heading="No transactions yet" sub="Transactions appear here once payments are processed." />}
      />

      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selected?.txnId ?? ''}
        subtitle={selected?.date}
        footer={selected?.status === 'paid' ? (
          <button className="bg-gf-red text-white border-0 rounded-full [padding:11px_22px] font-semibold cursor-pointer w-full"
            onClick={() => { setDrawerOpen(false); refundForm.reset(); setRefundOpen(true) }}>
            Issue Refund
          </button>
        ) : undefined}
      >
        {selected && (
          <div>
            <div className="flex items-center justify-between [margin-bottom:20px]">
              <span className="font-[var(--font-poppins)] font-bold text-[16px]">{selected.txnId}</span>
              <StatusBadge status={selected.status} />
            </div>
            <div className="[margin-bottom:20px]"><MethodCell method={selected.method} /></div>
            {[
              { label: 'Rental fee', value: `${money(selected.rentalFee)} THB` },
              { label: 'Delivery fee', value: `${money(selected.deliveryFee)} THB` },
              { label: 'Security deposit', value: `${money(selected.deposit ?? 0)} THB` },
              { label: 'Platform fee', value: `${money(selected.platformFee)} THB` },
              { label: 'Total', value: `${money(selected.total)} THB`, bold: true },
            ].map(r => (
              <div key={r.label} className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">{r.label}</span>
                <span className={cn(r.bold ? 'font-bold' : 'font-medium')}>{r.value}</span>
              </div>
            ))}
            <div className="[margin-top:20px]">
              <div className="flex justify-between [padding:10px_0] [border-bottom:1px_solid_var(--gf-line)] text-[13px]">
                <span className="text-gf-muted">Booking</span>
                <span className="font-[var(--font-poppins)] font-semibold [padding:2px_10px] rounded-full bg-gf-pink-100 text-gf-brown-900 text-[12px]">
                  #{selected.bookingNo}
                </span>
              </div>
              <div className="flex justify-between [padding:10px_0] text-[13px]">
                <span className="text-gf-muted">User</span>
                <span className="font-medium">{selected.user.displayName}</span>
              </div>
              <div className="flex justify-between [padding:10px_0] text-[13px] [border-top:1px_solid_var(--gf-line)]">
                <span className="text-gf-muted">Payment proof</span>
                <span className="font-medium">{selected.proofFile ?? 'No proof uploaded'}</span>
              </div>
              {selected.status === 'pending_review' && (
                <div className="flex gap-[10px] [margin-top:18px]">
                  <button className="flex-1 bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => evidenceMutation.mutate({ id: selected.id, action: 'approve_payment' })}>
                    Approve evidence
                  </button>
                  <button className="flex-1 bg-gf-red text-white border-0 rounded-full [padding:11px_0] font-semibold cursor-pointer" onClick={() => evidenceMutation.mutate({ id: selected.id, action: 'reject_payment' })}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>

      <FormDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        title="Issue Refund"
        submitLabel="Confirm refund"
        onSubmit={refundForm.handleSubmit((data) => {
          setRefundOpen(false)
          setConfirmOpen(true)
          refundForm.reset(data)
        })}
      >
        <form>
          <Label>Reason for refund</Label>
          <Textarea {...refundForm.register('reason')} placeholder="Explain why this refund is being issued…" className="[margin-top:6px]" />
          {refundForm.formState.errors.reason && (
            <span className="text-[12px] text-gf-red [margin-top:4px] block">
              {refundForm.formState.errors.reason.message}
            </span>
          )}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm refund?"
        description="The full amount will be refunded to the customer."
        destructive
        onConfirm={() => {
          if (selected) refundMutation.mutate({ id: selected.id, reason: refundForm.getValues('reason') })
          setConfirmOpen(false)
        }}
      />
    </div>
  )
}
