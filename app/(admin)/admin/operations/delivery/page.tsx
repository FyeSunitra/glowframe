'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Camera, MoreHorizontal, Truck } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { Pagination } from '@/components/common/Pagination'
import { ProductMediaLightbox } from '@/components/features/products/ProductMediaLightbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn } from '@/lib/utils'
import { adminOperationsService } from '@/services/adminOperations'
import { useAppStore } from '@/store/appStore'
import type { DeliveryOperation, OperationDirection, OperationMethod } from '@/types/adminOperations'

type DeliveryTab = 'active' | 'delivered'

export default function DeliveryPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminDelivery')
  const bookingText = getPageText(locale, 'myRentals')
  const router = useRouter()
  const [tab, setTab] = useState<DeliveryTab>('active')
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState<OperationDirection | ''>('')
  const [method, setMethod] = useState<OperationMethod | ''>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [selected, setSelected] = useState<DeliveryOperation | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [evidenceIndex, setEvidenceIndex] = useState<number | null>(null)
  const filters = { tab, search, direction, method, page, limit }
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'operations', 'delivery', filters],
    queryFn: () => adminOperationsService.deliveries(filters).then(unwrapApiResponse),
  })
  const dateTime = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium', timeStyle: 'short',
  })
  const rows = data?.items ?? []
  const evidence = selected?.evidenceUrl
    ? [{ id: selected.id, mediaType: 'image' as const, url: selected.evidenceUrl }]
    : []

  function openDetails(item: DeliveryOperation) {
    setSelected(item)
    setDrawerOpen(true)
  }

  const columns = [
    { key: 'bookingNo', header: t.bookingNo, render: (item: DeliveryOperation) => <span className="font-[var(--font-poppins)] text-[13px] font-semibold">{item.bookingNo}</span> },
    { key: 'product', header: t.product, render: (item: DeliveryOperation) => <span className="flex min-w-[180px] items-center gap-2.5"><ProductThumb product={item.product} /><span className="text-[13px]">{item.product.name}</span></span> },
    { key: 'direction', header: t.direction, render: (item: DeliveryOperation) => <DirectionBadge direction={item.direction} label={t[item.direction]} /> },
    { key: 'method', header: t.method, render: (item: DeliveryOperation) => bookingText.deliveryMethods[item.method] },
    { key: 'providerName', header: t.provider, render: (item: DeliveryOperation) => item.providerName ?? t.noData },
    { key: 'trackingNumber', header: t.tracking, render: (item: DeliveryOperation) => item.trackingNumber ?? t.noData },
    { key: 'updatedAt', header: t.updatedAt, render: (item: DeliveryOperation) => <span className="whitespace-nowrap text-[12.5px] text-gf-muted">{dateTime.format(new Date(item.updatedAt))}</span> },
    { key: 'status', header: t.status, render: (item: DeliveryOperation) => <StatusBadge label={t.statuses[item.status]} status={item.status} /> },
    { key: 'actions', header: '', render: (item: DeliveryOperation) => (
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={t.details} onClick={(event) => event.stopPropagation()} className="cursor-pointer rounded-[8px] border-0 bg-transparent p-2 text-gf-brown-700"><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end"><DropdownMenuItem onClick={() => openDetails(item)}>{t.details}</DropdownMenuItem></DropdownMenuContent>
      </DropdownMenu>
    ) },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
      <OperationTabs items={[{ value: 'active', label: t.activeTab }, { value: 'delivered', label: t.deliveredTab }]} value={tab} onChange={(value) => { setTab(value); setPage(1) }} />
      <FilterBar
        search={{ placeholder: t.search, value: search, onChange: (value) => { setSearch(value); setPage(1) } }}
        selects={[
          { label: t.direction, value: direction, options: [{ value: '', label: t.allDirections }, { value: 'outbound', label: t.outbound }, { value: 'return', label: t.return }], onChange: (value) => { setDirection(value as OperationDirection | ''); setPage(1) } },
          { label: t.method, value: method, options: [{ value: '', label: t.allMethods }, { value: 'pickup', label: bookingText.deliveryMethods.pickup }, { value: 'messenger', label: bookingText.deliveryMethods.messenger }, { value: 'shipping', label: bookingText.deliveryMethods.shipping }], onChange: (value) => { setMethod(value as OperationMethod | ''); setPage(1) } },
        ]}
      />
      {isError ? <EmptyState icon={Truck} heading={t.loadFailed} sub={t.noItemsSub} /> : (
        <>
          <DataTable columns={columns} data={rows} loading={isLoading} onRowClick={openDetails} empty={<EmptyState icon={Truck} heading={t.noItems} sub={t.noItemsSub} />} />
          {data && data.meta.total > 0 && <Pagination {...data.meta} onPageChange={setPage} onLimitChange={(value) => { setLimit(value); setPage(1) }} />}
        </>
      )}

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? `${t.bookingNo} ${selected.bookingNo}` : ''} subtitle={selected ? t.statuses[selected.status] : undefined}
        footer={selected ? <button type="button" onClick={() => router.push('/admin/bookings')} className="w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-5 py-3 text-sm font-semibold text-gf-brown-900">{t.viewBookings}</button> : undefined}>
        {selected && <div>
          <div className="mb-5 flex items-center gap-3"><ProductThumb product={selected.product} large /><div className="min-w-0"><div className="font-semibold text-gf-brown-900">{selected.product.name}</div><div className="mt-1 text-xs text-gf-muted">{t[selected.direction]}</div></div></div>
          <SectionTitle>{t.details}</SectionTitle>
          <DetailRow label={t.renter} value={selected.renter} />
          <DetailRow label={t.owner} value={selected.owner} />
          <DetailRow label={t.method} value={bookingText.deliveryMethods[selected.method]} />
          <DetailRow label={t.provider} value={selected.providerName ?? t.noData} />
          <DetailRow label={t.tracking} value={selected.trackingNumber ?? t.noData} />
          <DetailRow label={t.destination} value={selected.address ?? t.noData} />
          {selected.note && <DetailRow label={t.note} value={selected.note} />}
          {selected.evidenceUrl && <><SectionTitle>{t.evidence}</SectionTitle><button type="button" onClick={() => setEvidenceIndex(0)} className="w-full cursor-pointer border-0 bg-transparent p-0"><span className="relative block aspect-video w-full overflow-hidden rounded-[8px] border border-gf-line bg-white"><Image src={selected.evidenceUrl} alt={t.evidence} fill sizes="520px" className="object-cover" /></span></button></>}
          <SectionTitle>{t.timeline}</SectionTitle>
          <div className="relative ml-2 border-l border-gf-line pl-5">{selected.timeline.map((event) => <div key={`${event.event}-${event.at}`} className="relative pb-5 last:pb-0"><span className="absolute -left-[25px] top-1 size-2 rounded-full bg-gf-pink-500 ring-4 ring-white" /><div className="text-sm font-medium text-gf-brown-800">{t.events[event.event]}</div><div className="mt-1 text-xs text-gf-muted">{dateTime.format(new Date(event.at))}</div></div>)}</div>
        </div>}
      </DetailDrawer>
      <ProductMediaLightbox media={evidence} productName={selected?.product.name ?? t.evidence} initialIndex={evidenceIndex} onIndexChange={setEvidenceIndex} onOpenChange={(open) => { if (!open) setEvidenceIndex(null) }} />
    </div>
  )
}

function ProductThumb({ product, large = false }: { product: DeliveryOperation['product']; large?: boolean }) {
  return <span className={cn('relative shrink-0 overflow-hidden rounded-[6px] bg-gf-pink-100', large ? 'size-16' : 'size-10')}>{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes={large ? '64px' : '40px'} className="object-cover" /> : <Camera className="absolute inset-0 m-auto text-gf-brown-300" size={large ? 25 : 18} />}</span>
}

function DirectionBadge({ direction, label }: { direction: OperationDirection; label: string }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', direction === 'outbound' ? 'bg-[#E2ECF8] text-[#315D8A]' : 'bg-[#F0E5F7] text-[#76518B]')}>{label}</span>
}

function StatusBadge({ label, status }: { label: string; status: DeliveryOperation['status'] }) {
  const complete = status === 'received' || status === 'returnReceived'
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', complete ? 'bg-[#DFF2E0] text-gf-green' : 'bg-[#FEF3CD] text-gf-yellow')}>{label}</span>
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
