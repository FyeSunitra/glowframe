'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Camera, MoreHorizontal, PackageCheck } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { Pagination } from '@/components/common/Pagination'
import { ProductMediaLightbox } from '@/components/features/products/ProductMediaLightbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn } from '@/lib/utils'
import { adminOperationsService } from '@/services/adminOperations'
import { useAppStore } from '@/store/appStore'
import type {
  ReturnOperation,
  ReturnOperationStatus,
} from '@/types/adminOperations'

type ReturnTab = 'pending' | 'history'

export default function ReturnsPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminReturns')
  const bookingText = getPageText(locale, 'myRentals')
  const router = useRouter()
  const [tab, setTab] = useState<ReturnTab>('pending')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ReturnOperationStatus | ''>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<ReturnOperation | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [evidenceIndex, setEvidenceIndex] = useState<number | null>(null)

  const filters = { tab, search, status, page, limit }
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'operations', 'returns', filters],
    queryFn: () =>
      adminOperationsService.returns(filters).then(unwrapApiResponse),
  })
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' },
  )
  const dateTimeFormatter = new Intl.DateTimeFormat(
    locale === 'th' ? 'th-TH' : 'en-GB',
    { dateStyle: 'medium', timeStyle: 'short' },
  )
  const rows = data?.items ?? []
  const evidence = selected
    ? [
        { id: 'return', label: t.evidence, url: selected.evidenceUrl },
        { id: 'damage', label: t.damageEvidence, url: selected.damageEvidenceUrl },
      ].flatMap((item) => item.url ? [{ ...item, url: item.url }] : [])
    : []
  const statusOptions = [
    { value: '', label: t.allStatuses },
    ...(tab === 'pending'
      ? [
          { value: 'active', label: t.statuses.active },
          { value: 'overdue', label: t.statuses.overdue },
          { value: 'awaitingOwner', label: t.statuses.awaitingOwner },
        ]
      : [
          { value: 'completed', label: t.statuses.completed },
          { value: 'damageReported', label: t.statuses.damageReported },
          { value: 'disputed', label: t.statuses.disputed },
        ]),
  ]

  function openDetails(item: ReturnOperation) {
    setSelected(item)
    setDrawerOpen(true)
  }

  const columns = [
    {
      key: 'bookingNo',
      header: t.bookingNo,
      render: (item: ReturnOperation) => (
        <span className="font-[var(--font-poppins)] text-[13px] font-semibold">
          {item.bookingNo}
        </span>
      ),
    },
    {
      key: 'product',
      header: t.product,
      render: (item: ReturnOperation) => (
        <span className="flex min-w-[180px] items-center gap-2.5">
          <ProductThumb product={item.product} />
          <span className="text-[13px]">{item.product.name}</span>
        </span>
      ),
    },
    { key: 'renter', header: t.renter },
    { key: 'owner', header: t.owner },
    {
      key: 'dueDate',
      header: t.dueDate,
      render: (item: ReturnOperation) => (
        <span className={cn('whitespace-nowrap text-[12.5px]', item.status === 'overdue' ? 'font-semibold text-gf-red' : 'text-gf-muted')}>
          {dateFormatter.format(parseDate(item.dueDate))}
        </span>
      ),
    },
    {
      key: 'method',
      header: t.method,
      render: (item: ReturnOperation) => item.method
        ? bookingText.deliveryMethods[item.method]
        : t.noData,
    },
    {
      key: 'status',
      header: t.status,
      render: (item: ReturnOperation) => (
        <OperationStatus label={t.statuses[item.status]} status={item.status} />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: ReturnOperation) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t.details}
            onClick={(event) => event.stopPropagation()}
            className="cursor-pointer rounded-[8px] border-0 bg-transparent p-2 text-gf-brown-700"
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => openDetails(item)}>
              {t.details}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
      <OperationTabs
        items={[
          { value: 'pending', label: t.pendingTab },
          { value: 'history', label: t.historyTab },
        ]}
        value={tab}
        onChange={(value) => {
          setTab(value)
          setStatus('')
          setPage(1)
        }}
      />
      <FilterBar
        search={{
          placeholder: t.search,
          value: search,
          onChange: (value) => {
            setSearch(value)
            setPage(1)
          },
        }}
        selects={[
          {
            label: t.status,
            value: status,
            options: statusOptions,
            onChange: (value) => {
              setStatus(value as ReturnOperationStatus | '')
              setPage(1)
            },
          },
        ]}
      />

      {isError ? (
        <EmptyState icon={PackageCheck} heading={t.loadFailed} sub={t.noItemsSub} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            loading={isLoading}
            onRowClick={openDetails}
            empty={<EmptyState icon={PackageCheck} heading={t.noItems} sub={t.noItemsSub} />}
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
        subtitle={selected ? t.statuses[selected.status] : undefined}
        footer={
          selected ? (
            <button
              type="button"
              onClick={() => router.push('/admin/bookings')}
              className="w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-5 py-3 text-sm font-semibold text-gf-brown-900"
            >
              {t.viewBookings}
            </button>
          ) : undefined
        }
      >
        {selected && (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <ProductThumb product={selected.product} large />
              <div className="min-w-0">
                <div className="font-semibold text-gf-brown-900">{selected.product.name}</div>
                <div className="mt-1 text-xs text-gf-muted">{selected.bookingNo}</div>
              </div>
            </div>
            <SectionTitle>{t.details}</SectionTitle>
            <DetailRow label={t.renter} value={selected.renter} />
            <DetailRow label={t.owner} value={selected.owner} />
            <DetailRow label={t.dueDate} value={dateFormatter.format(parseDate(selected.dueDate))} />
            <DetailRow label={t.method} value={selected.method ? bookingText.deliveryMethods[selected.method] : t.noData} />
            <DetailRow label={t.provider} value={selected.providerName ?? t.noData} />
            <DetailRow label={t.tracking} value={selected.trackingNumber ?? t.noData} />
            {selected.note && <DetailRow label={t.note} value={selected.note} />}
            {selected.renterReturnedAt && <DetailRow label={t.returnedAt} value={dateTimeFormatter.format(new Date(selected.renterReturnedAt))} />}
            {selected.ownerReceivedAt && <DetailRow label={t.receivedAt} value={dateTimeFormatter.format(new Date(selected.ownerReceivedAt))} />}

            {selected.damageDescription && (
              <>
                <SectionTitle>{t.damage}</SectionTitle>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gf-brown-800">{selected.damageDescription}</p>
              </>
            )}

            {evidence.length > 0 && (
              <>
                <SectionTitle>{t.evidence}</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {evidence.map((item, index) => (
                    <button key={item.id} type="button" onClick={() => setEvidenceIndex(index)} className="cursor-pointer border-0 bg-transparent p-0 text-left">
                      <span className="relative block aspect-video overflow-hidden rounded-[8px] border border-gf-line bg-white">
                        <Image src={item.url} alt={item.label} fill sizes="280px" className="object-cover" />
                      </span>
                      <span className="mt-1.5 block text-xs text-gf-muted">{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DetailDrawer>

      <ProductMediaLightbox
        media={evidence.map((item) => ({ id: item.id, mediaType: 'image' as const, url: item.url }))}
        productName={selected?.product.name ?? t.evidence}
        initialIndex={evidenceIndex}
        onIndexChange={setEvidenceIndex}
        onOpenChange={(open) => { if (!open) setEvidenceIndex(null) }}
      />
    </div>
  )
}

function ProductThumb({ product, large = false }: { product: ReturnOperation['product']; large?: boolean }) {
  return (
    <span className={cn('relative shrink-0 overflow-hidden rounded-[6px] bg-gf-pink-100', large ? 'size-16' : 'size-10')}>
      {product.imageUrl ? (
        <Image src={product.imageUrl} alt={product.name} fill sizes={large ? '64px' : '40px'} className="object-cover" />
      ) : (
        <Camera className="absolute inset-0 m-auto text-gf-brown-300" size={large ? 25 : 18} />
      )}
    </span>
  )
}

function OperationStatus({ label, status }: { label: string; status: ReturnOperationStatus }) {
  const danger = status === 'overdue' || status === 'damageReported' || status === 'disputed'
  const complete = status === 'completed'
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', danger ? 'bg-[#FAE0DA] text-gf-red' : complete ? 'bg-[#DFF2E0] text-gf-green' : 'bg-[#FEF3CD] text-gf-yellow')}>{label}</span>
}

function OperationTabs<T extends string>({ items, value, onChange }: { items: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  return <div className="mb-5 flex w-fit rounded-full bg-gf-pink-100 p-1.5">{items.map((item) => <button key={item.value} type="button" onClick={() => onChange(item.value)} className={cn('cursor-pointer rounded-full border-0 px-5 py-2.5 text-sm font-semibold', value === item.value ? 'bg-gf-pink-500 text-gf-brown-900' : 'bg-transparent text-gf-brown-700')}>{item.label}</button>)}</div>
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 mt-6 border-b border-gf-line pb-2 text-sm font-semibold text-gf-brown-900">{children}</h3>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-gf-line py-2.5 text-sm"><span className="shrink-0 text-gf-muted">{label}</span><span className="min-w-0 break-words text-right font-medium text-gf-brown-800">{value}</span></div>
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}
