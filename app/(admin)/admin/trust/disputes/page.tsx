'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Camera, MoreHorizontal } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { Pagination } from '@/components/common/Pagination'
import { ProductMediaLightbox } from '@/components/features/products/ProductMediaLightbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn, money } from '@/lib/utils'
import { adminDisputeService } from '@/services/adminDisputes'
import { useAppStore } from '@/store/appStore'
import type {
  AdminDispute,
  DamageDecision,
  ResolveDamagePayload,
} from '@/types/adminDispute'

type ClaimStatus = 'pending' | 'resolved'

export default function DisputesPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminDisputes')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<ClaimStatus>('pending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<AdminDispute | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [decision, setDecision] = useState<DamageDecision>('no_damage')
  const [approvedAmount, setApprovedAmount] = useState('')
  const [decisionNote, setDecisionNote] = useState('')
  const [evidenceIndex, setEvidenceIndex] = useState<number | null>(null)

  const filters = { status, search, page, limit }
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'damage-claims', filters],
    queryFn: () =>
      adminDisputeService.list(filters).then(unwrapApiResponse),
  })

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ResolveDamagePayload
    }) => adminDisputeService.resolve(id, payload).then(unwrapApiResponse),
    onSuccess: (updated) => {
      setSelected(updated)
      setResolveOpen(false)
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'damage-claims'],
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
      showToast(t.success)
    },
    onError: (error) => {
      showToast(error instanceof Error ? error.message : t.failed)
    },
  })

  const rows = data?.items ?? []
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { dateStyle: 'medium', timeStyle: 'short' },
  )
  const evidence = selected
    ? [
        {
          id: 'delivery',
          label: t.deliveryEvidence,
          url: selected.deliveryEvidenceUrl,
        },
        {
          id: 'return',
          label: t.returnEvidence,
          url: selected.returnEvidenceUrl,
        },
        {
          id: 'damage',
          label: t.damageEvidence,
          url: selected.damageEvidenceUrl,
        },
      ].flatMap((item) =>
        item.url ? [{ ...item, url: item.url }] : [],
      )
    : []

  function selectClaim(row: AdminDispute) {
    setSelected(row)
    setDrawerOpen(true)
  }

  function openResolution(row: AdminDispute) {
    setSelected(row)
    setDecision('no_damage')
    setApprovedAmount('')
    setDecisionNote('')
    setResolveOpen(true)
  }

  function submitResolution() {
    if (!selected || !decisionNote.trim()) {
      showToast(t.required)
      return
    }
    const amount = Number(approvedAmount)
    const maximum = Math.min(selected.claimedAmount, selected.deposit)
    if (
      decision === 'partial_damage' &&
      (!Number.isFinite(amount) || amount <= 0 || amount >= maximum)
    ) {
      showToast(t.required)
      return
    }

    resolveMutation.mutate({
      id: selected.id,
      payload: {
        decision,
        approvedAmount:
          decision === 'partial_damage' ? amount : undefined,
        note: decisionNote.trim(),
      },
    })
  }

  const columns = [
    {
      key: 'bookingNo',
      header: t.bookingNo,
      render: (row: AdminDispute) => (
        <span className="font-[var(--font-poppins)] text-[13px] font-semibold">
          {row.bookingNo}
        </span>
      ),
    },
    {
      key: 'product',
      header: t.product,
      render: (row: AdminDispute) => (
        <span className="flex min-w-[180px] items-center gap-2.5">
          <span className="relative size-10 shrink-0 overflow-hidden rounded-[6px] bg-gf-pink-100">
            {row.product.imageUrl ? (
              <Image
                src={row.product.imageUrl}
                alt={row.product.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <Camera
                className="absolute inset-0 m-auto text-gf-brown-300"
                size={18}
              />
            )}
          </span>
          <span className="text-[13px]">{row.product.name}</span>
        </span>
      ),
    },
    {
      key: 'owner',
      header: t.owner,
      render: (row: AdminDispute) => row.owner.displayName,
    },
    {
      key: 'renter',
      header: t.renter,
      render: (row: AdminDispute) => row.renter.displayName,
    },
    {
      key: 'claimedAmount',
      header: t.claimAmount,
      render: (row: AdminDispute) => `${money(row.claimedAmount)} THB`,
    },
    {
      key: 'status',
      header: t.status,
      render: (row: AdminDispute) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row: AdminDispute) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t.view}
            onClick={(event) => event.stopPropagation()}
            className="cursor-pointer rounded-[8px] border-0 bg-transparent p-2 text-gf-brown-700"
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => selectClaim(row)}>
              {t.view}
            </DropdownMenuItem>
            {row.status === 'pending' && (
              <DropdownMenuItem onClick={() => openResolution(row)}>
                {t.resolve}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />

      <div className="mb-5 flex w-fit rounded-full bg-gf-pink-100 p-1.5">
        {(['pending', 'resolved'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setStatus(value)
              setPage(1)
            }}
            className={cn(
              'cursor-pointer rounded-full border-0 px-5 py-2.5 text-sm font-semibold',
              status === value
                ? 'bg-gf-pink-500 text-gf-brown-900'
                : 'bg-transparent text-gf-brown-700',
            )}
          >
            {value === 'pending' ? t.pending : t.resolved}
          </button>
        ))}
      </div>

      <FilterBar
        search={{
          placeholder: t.search,
          value: search,
          onChange: (value) => {
            setSearch(value)
            setPage(1)
          },
        }}
      />

      {isError ? (
        <EmptyState
          icon={AlertTriangle}
          heading={t.loadFailed}
          sub={t.noClaimsSub}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            loading={isLoading}
            onRowClick={selectClaim}
            empty={
              <EmptyState
                icon={AlertTriangle}
                heading={t.noClaims}
                sub={t.noClaimsSub}
              />
            }
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
        title={selected ? `${t.bookingNo} ${selected.bookingNo}` : ''}
        subtitle={selected?.status}
        footer={
          selected?.status === 'pending' ? (
            <button
              type="button"
              onClick={() => openResolution(selected)}
              className="w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-5 py-3 text-sm font-semibold text-gf-brown-900"
            >
              {t.resolve}
            </button>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6">
            <section>
              <SectionTitle>{t.claimDetails}</SectionTitle>
              <DetailRow label={t.product} value={selected.product.name} />
              <DetailRow label={t.owner} value={`${selected.owner.displayName} (${selected.owner.email})`} />
              <DetailRow label={t.renter} value={`${selected.renter.displayName} (${selected.renter.email})`} />
              <DetailRow label={t.rentalFee} value={`${money(selected.rentalFee)} THB`} />
              <DetailRow label={t.deposit} value={`${money(selected.deposit)} THB`} />
              <DetailRow label={t.claimAmount} value={`${money(selected.claimedAmount)} THB`} strong />
            </section>

            <section>
              <SectionTitle>{t.description}</SectionTitle>
              <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-gf-brown-800">
                {selected.damageDescription}
              </p>
              {selected.renterReason && (
                <div className="mt-4">
                  <div className="mb-1 text-xs text-gf-muted">{t.renterReason}</div>
                  <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-gf-brown-800">
                    {selected.renterReason}
                  </p>
                </div>
              )}
            </section>

            <section>
              <SectionTitle>{t.evidence}</SectionTitle>
              {evidence.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {evidence.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEvidenceIndex(index)}
                      className="cursor-pointer border-0 bg-transparent p-0 text-left"
                    >
                      <span className="relative block aspect-square overflow-hidden rounded-[8px] border border-gf-line bg-white">
                        <Image
                          src={item.url}
                          alt={item.label}
                          fill
                          sizes="180px"
                          className="object-cover"
                        />
                      </span>
                      <span className="mt-1.5 block text-xs text-gf-muted">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gf-muted">{t.noEvidence}</p>
              )}
            </section>

            {selected.status === 'resolved' && selected.decision && (
              <section>
                <SectionTitle>{t.decision}</SectionTitle>
                <DetailRow
                  label={t.decision}
                  value={t.decisionLabels[selected.decision]}
                />
                <DetailRow
                  label={t.approvedAmount}
                  value={`${money(selected.approvedAmount ?? 0)} THB`}
                  strong
                />
                <DetailRow
                  label={t.decisionNote}
                  value={selected.decisionNote ?? '-'}
                />
                {selected.reviewedBy && (
                  <DetailRow label={t.reviewedBy} value={selected.reviewedBy} />
                )}
                {selected.reviewedAt && (
                  <DetailRow
                    label={t.reviewedAt}
                    value={dateFormatter.format(new Date(selected.reviewedAt))}
                  />
                )}
              </section>
            )}
          </div>
        )}
      </DetailDrawer>

      <FormDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        title={t.resolveTitle}
        submitLabel={t.submit}
        onSubmit={submitResolution}
        contentClassName="sm:max-w-[680px]"
      >
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>{t.decisionLabel}</Label>
            <Select
              value={decision}
              onValueChange={(value) => {
                if (
                  value === 'no_damage' ||
                  value === 'partial_damage' ||
                  value === 'full_damage'
                ) {
                  setDecision(value)
                  setApprovedAmount(
                    value === 'full_damage' && selected
                      ? String(Math.min(selected.claimedAmount, selected.deposit))
                      : '',
                  )
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.selectDecision} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_damage">{t.noDamage}</SelectItem>
                <SelectItem value="partial_damage">{t.partialDamage}</SelectItem>
                <SelectItem value="full_damage">{t.fullDamage}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {decision !== 'no_damage' && (
            <div className="grid gap-1.5">
              <Label>{t.amount}</Label>
              <Input
                type="number"
                min={0}
                max={selected ? Math.min(selected.claimedAmount, selected.deposit) : 0}
                step="0.01"
                value={approvedAmount}
                disabled={decision === 'full_damage'}
                onChange={(event) => setApprovedAmount(event.target.value)}
              />
            </div>
          )}

          <div className="grid gap-1.5">
            <Label>{t.note}</Label>
            <Textarea
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder={t.notePlaceholder}
              rows={5}
            />
          </div>
        </div>
      </FormDialog>

      <ProductMediaLightbox
        media={evidence.map((item) => ({
          id: item.id,
          mediaType: 'image' as const,
          url: item.url,
        }))}
        productName={selected?.product.name ?? t.evidence}
        initialIndex={evidenceIndex}
        onIndexChange={setEvidenceIndex}
        onOpenChange={(open) => {
          if (!open) setEvidenceIndex(null)
        }}
      />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-0 border-b border-gf-line pb-2 text-sm font-bold text-gf-brown-900">
      {children}
    </h3>
  )
}

function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: React.ReactNode
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gf-line py-2.5 text-sm">
      <span className="shrink-0 text-gf-muted">{label}</span>
      <span
        className={cn(
          'min-w-0 text-right text-gf-brown-800',
          strong && 'font-bold text-gf-brown-900',
        )}
      >
        {value}
      </span>
    </div>
  )
}
