'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Eye,
  Package,
  Pencil,
  Play,
  Plus,
  Power,
  PowerOff,
  XCircle,
} from 'lucide-react'

import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { CameraGlyph } from '@/components/common/CameraGlyph'
import { ProductMediaLightbox } from '@/components/features/products/ProductMediaLightbox'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn, money } from '@/lib/utils'
import { productService } from '@/services/products'
import { useAppStore } from '@/store/appStore'
import type { Product } from '@/types'
import type {
  OwnerProductAction,
} from '@/types/product'

interface ConfirmState {
  title: string
  description: string
  productId: number
  action: OwnerProductAction
  destructive: boolean
}

export default function ListCameraPage() {
  const router = useRouter()
  const t = getPageText(useAppStore((state) => state.locale), 'listing')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['products', 'mine'],
    queryFn: async () => unwrapApiResponse(await productService.mine()),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: OwnerProductAction }) =>
      productService.changeMineStatus(id, action).then(unwrapApiResponse),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setSelectedProduct((current) => current?.id === product.id ? product : current)
      setConfirm(null)
      showToast(t.statusUpdated)
    },
    onError: () => showToast(t.statusUpdateFailed),
  })

  async function openDetail(product: Product) {
    setSelectedProduct(product)
    setDetailOpen(true)
    const response = await productService.getMine(product.id)
    if (response.success) setSelectedProduct(response.data)
  }


  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.home, t.listCamera]} />
      <section className="rounded-[8px] bg-white p-5 shadow-[var(--gf-shadow)] sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="m-0 flex items-center gap-2.5 text-[19px] font-bold text-gf-brown-900">
            <Package size={20} />
            {t.myProducts}
          </h1>
          <Link
            href="/list-camera/add"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-4 py-2 text-[13px] font-semibold text-gf-brown-800 no-underline"
          >
            <Plus size={16} />
            {t.addProduct}
          </Link>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-gf-muted">{t.loadingProducts}</div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-gf-red">{t.loadProductsFailed}</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="m-0 text-sm text-gf-muted">{t.noProducts}</p>
            <Link
              href="/list-camera/add"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gf-pink-100 px-5 py-2.5 text-sm font-semibold text-gf-brown-800 no-underline"
            >
              <Plus size={18} />
              {t.addProduct}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gf-line">
            {products.map((product, index) => (
              <OwnerProductRow
                key={product.id}
                product={product}
                priority={index === 0}
                labels={t}
                onView={() => openDetail(product)}
                onEdit={() => router.push(`/list-camera/add?edit=${product.id}`)}
                onAction={(action) => {
                  const isCancel = action === 'cancel_request'
                  const isHide = action === 'hide'
                  setConfirm({
                    productId: product.id,
                    action,
                    title: isCancel
                      ? t.cancelRequestTitle
                      : isHide
                        ? t.hideListingTitle
                        : t.reopenListingTitle,
                    description: isCancel
                      ? t.cancelRequestDescription
                      : isHide
                        ? t.hideListingDescription
                        : t.reopenListingDescription,
                    destructive: isCancel,
                  })
                }}
              />
            ))}
          </div>
        )}
      </section>

      <DetailDrawer
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selectedProduct?.name ?? ''}
        subtitle={selectedProduct?.status}
      >
        {selectedProduct && <OwnerProductDetail product={selectedProduct} labels={t} />}
      </DetailDrawer>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => { if (!open) setConfirm(null) }}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        destructive={confirm?.destructive}
        onConfirm={() => {
          if (confirm) {
            statusMutation.mutate({
              id: confirm.productId,
              action: confirm.action,
            })
          }
        }}
      />
    </div>
  )
}

function OwnerProductRow({
  product,
  priority,
  labels,
  onView,
  onEdit,
  onAction,
}: {
  product: Product
  priority: boolean
  labels: ReturnType<typeof getPageText<'listing'>>
  onView: () => void
  onEdit: () => void
  onAction: (action: OwnerProductAction) => void
}) {
  const mainImage = product.media?.find((item) => item.mediaType === 'image')
  const canEdit = product.status !== 'archived'

  return (
    <article className="grid gap-4 py-4 lg:grid-cols-[96px_minmax(0,1fr)_auto] lg:items-center">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-gf-pink-100 lg:aspect-square"
        style={{ background: `${product.color}20` }}
      >
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={product.name}
            fill
            priority={priority}
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CameraGlyph color={product.color} size={42} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="m-0 text-[15px] font-semibold text-gf-brown-900">
            {product.name}
          </h2>
          <StatusBadge status={product.status ?? 'pending'} />
        </div>
        <p className="m-0 text-[13px] text-gf-muted">
          {[product.brand?.name, product.model].filter(Boolean).join(' · ')}
        </p>
        <p className="mb-0 mt-1.5 text-[13px] font-semibold text-gf-brown-800">
          {money(product.price)} THB / {labels.perDay}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <ActionButton icon={Eye} label={labels.viewDetails} onClick={onView} />
        {canEdit && (
          <ActionButton icon={Pencil} label={labels.editProduct} onClick={onEdit} />
        )}
        {product.status === 'pending' && (
          <ActionButton
            icon={XCircle}
            label={labels.cancelRequest}
            destructive
            onClick={() => onAction('cancel_request')}
          />
        )}
        {product.status === 'approved' && (
          <ActionButton
            icon={PowerOff}
            label={labels.hideListing}
            onClick={() => onAction('hide')}
          />
        )}
        {product.status === 'hidden' && (
          <ActionButton
            icon={Power}
            label={labels.reopenListing}
            onClick={() => onAction('reopen')}
          />
        )}
      </div>
    </article>
  )
}

function ActionButton({
  icon: Icon,
  label,
  destructive,
  onClick,
}: {
  icon: typeof Eye
  label: string
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border bg-white px-3 text-xs font-semibold',
        destructive
          ? 'border-gf-red text-gf-red'
          : 'border-gf-brown-300 text-gf-brown-800',
      )}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function OwnerProductDetail({
  product,
  labels,
}: {
  product: Product
  labels: ReturnType<typeof getPageText<'listing'>>
}) {
  const media = product.media ?? []
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  return (
    <div>
      {media.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-2">
          {media.map((item, index) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setPreviewIndex(index)}
              className={cn(
                'relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-[8px] border border-gf-line bg-white p-0',
                index === 0 && 'col-span-2',
              )}
            >
              {item.mediaType === 'image' ? (
                <Image
                  src={item.url}
                  alt={`${product.name} ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 92vw, 620px"
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
      )}
      <p className="whitespace-pre-wrap text-sm leading-7 text-gf-brown-700">
        {product.desc || '-'}
      </p>
      {[
        { label: labels.category, value: product.category?.name ?? '-' },
        { label: labels.brand, value: product.brand?.name ?? '-' },
        { label: labels.model, value: product.model ?? '-' },
        { label: labels.serialNumber, value: product.serialNumber ?? '-' },
        { label: labels.conditionNote, value: product.conditionNote ?? '-' },
        { label: labels.dailyPrice, value: `${money(product.price)} THB` },
        { label: labels.deposit, value: `${money(product.deposit)} THB` },
        {
          label: labels.includedAccessories,
          value:
            product.accessories
              ?.map((item) => `${item.name} x${item.quantity}`)
              .join(', ') || '-',
        },
      ].map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[130px_minmax(0,1fr)] gap-3 border-b border-gf-line py-3 text-[13px]"
        >
          <span className="text-gf-muted">{row.label}</span>
          <span className="break-words font-semibold text-gf-brown-900">{row.value}</span>
        </div>
      ))}
      {product.rejectionReason && (
        <div className="mt-5 rounded-[8px] bg-[#FAE0DA] p-4">
          <h3 className="m-0 text-sm font-semibold text-gf-red">
            {labels.rejectionReason}
          </h3>
          <p className="mb-0 mt-2 text-[13px] leading-6 text-gf-brown-700">
            {product.rejectionReason}
          </p>
        </div>
      )}
      <ProductMediaLightbox
        media={media}
        productName={product.name}
        initialIndex={previewIndex}
        onIndexChange={setPreviewIndex}
        onOpenChange={(open) => { if (!open) setPreviewIndex(null) }}
      />
    </div>
  )
}
