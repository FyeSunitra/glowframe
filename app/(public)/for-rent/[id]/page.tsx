'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Camera,
  Expand,
  MapPin,
  PackageCheck,
  Play,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { CameraGlyph } from '@/components/common/CameraGlyph';
import { ProductMediaLightbox } from '@/components/features/products/ProductMediaLightbox';
import { unwrapApiResponse } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getPageText } from '@/lib/menuI18n';
import { productService } from '@/services/products';
import { useAppStore } from '@/store/appStore';

export default function ProductDetailPage() {
  const locale = useAppStore((state) => state.locale);
  const t = getPageText(locale, 'catalog');
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'detail' | 'policy'>('detail');
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => unwrapApiResponse(await productService.get(id)),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <div className="px-4 py-16 text-center text-gf-muted">{t.loading}</div>;
  }

  if (isError || !product) {
    return <div className="px-4 py-16 text-center text-gf-muted">{t.notFound}</div>;
  }

  const media = [...(product.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedMedia = media.find((item) => item.id === selectedMediaId) ?? media[0];
  const currency = new Intl.NumberFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  });

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.allProducts, product.name]} />

      <section className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
        <div className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-gf-pink-100">
            {selectedMedia?.mediaType === 'image' ? (
              <button
                type="button"
                onClick={() =>
                  setPreviewIndex(
                    Math.max(0, media.findIndex((item) => item.id === selectedMedia.id)),
                  )
                }
                className="absolute inset-0 cursor-zoom-in border-0 bg-transparent p-0"
              >
                <Image
                  src={selectedMedia.url}
                  alt={`${t.image}: ${product.name}`}
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                />
              </button>
            ) : selectedMedia?.mediaType === 'video' ? (
              <>
                <video
                  src={selectedMedia.url}
                  controls
                  className="h-full w-full bg-black object-contain"
                  aria-label={`${t.video}: ${product.name}`}
                />
                <button
                  type="button"
                  onClick={() =>
                    setPreviewIndex(
                      Math.max(0, media.findIndex((item) => item.id === selectedMedia.id)),
                    )
                  }
                  className="absolute right-3 top-3 flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-black/65 text-white"
                  aria-label={t.productMedia}
                >
                  <Expand size={18} />
                </button>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-gf-muted">
                <CameraGlyph color={product.color} size={150} />
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Camera size={17} />
                  {t.noMedia}
                </span>
              </div>
            )}
          </div>

          {media.length > 1 && (
            <div
              className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6"
              aria-label={t.productMedia}
            >
              {media.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedMediaId(item.id)
                    setPreviewIndex(index)
                  }}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-lg border-2 bg-gf-pink-50',
                    selectedMedia?.id === item.id
                      ? 'border-gf-pink-500'
                      : 'border-transparent hover:border-gf-pink-300',
                  )}
                  aria-label={`${item.mediaType === 'video' ? t.video : t.image} ${index + 1}`}
                >
                  {item.mediaType === 'image' ? (
                    <Image
                      src={item.url}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-gf-brown-700">
                      <Play size={22} fill="currentColor" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-[20px] bg-white p-5 shadow-[var(--gf-shadow)] sm:p-7">
          <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold text-gf-brown-700">
            {product.category && (
              <span className="rounded-full bg-gf-pink-100 px-3 py-1.5">
                {product.category.name}
              </span>
            )}
            {product.brand && (
              <span className="rounded-full bg-gf-yellow-100 px-3 py-1.5">
                {product.brand.name}
              </span>
            )}
          </div>

          <h1 className="m-0 text-2xl font-bold leading-tight text-gf-brown-900 sm:text-[28px]">
            {product.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gf-muted">
            <span className="flex items-center gap-1.5 font-semibold text-gf-brown-700">
              <Star size={16} fill="currentColor" className="text-gf-yellow-500" />
              {product.rating.toFixed(1)}
            </span>
            {product.owner && (
              <span className="flex items-center gap-1.5">
                {product.owner.verified && <BadgeCheck size={17} className="text-gf-pink-600" />}
                {t.owner}: {product.owner.displayName}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-7 text-gf-brown-700">{product.desc}</p>

          <div className="my-6 grid grid-cols-2 border-y border-gf-pink-100 py-5">
            <div className="border-r border-gf-pink-100 pr-4">
              <p className="m-0 text-xs text-gf-muted">{t.perDay}</p>
              <p className="mt-1 text-2xl font-bold text-gf-pink-700">
                {currency.format(product.price)}
              </p>
            </div>
            <div className="pl-5">
              <p className="m-0 text-xs text-gf-muted">{t.securityDeposit}</p>
              <p className="mt-1 text-xl font-bold text-gf-brown-900">
                {currency.format(product.deposit)}
              </p>
            </div>
          </div>

          {product.pickupArea && (
            <div className="flex items-start gap-3 text-sm">
              <MapPin size={19} className="mt-0.5 shrink-0 text-gf-pink-600" />
              <div>
                <p className="m-0 font-semibold text-gf-brown-900">{t.pickupArea}</p>
                <p className="mt-1 text-gf-brown-700">
                  {product.pickupArea.district}, {product.pickupArea.province}
                </p>
                <p className="mt-1 text-xs leading-5 text-gf-muted">{t.pickupAreaHint}</p>
              </div>
            </div>
          )}

          {product.owner?.verified && (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gf-brown-700">
              <ShieldCheck size={18} className="text-emerald-600" />
              {t.verifiedOwner}
            </div>
          )}

          <Link
            href={`/for-rent/${id}/booking`}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-gf-pink-500 px-6 py-3 text-center text-[15px] font-semibold text-gf-brown-900 no-underline transition-colors hover:bg-gf-pink-600"
          >
            {t.requestRental}
          </Link>
          <p className="mb-0 mt-2 text-center text-xs text-gf-muted">{t.chooseDeliveryLater}</p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex w-full gap-1 border-b border-gf-pink-200 sm:w-auto">
          {(['detail', 'policy'] as const).map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setTab(tabKey)}
              className={cn(
                'min-h-11 flex-1 border-0 border-b-2 bg-transparent px-4 py-3 text-sm font-semibold sm:flex-none sm:px-6',
                tab === tabKey
                  ? 'border-gf-pink-500 text-gf-brown-900'
                  : 'border-transparent text-gf-muted hover:text-gf-brown-700',
              )}
            >
              {tabKey === 'detail' ? t.productDetails : t.rentalPolicy}
            </button>
          ))}
        </div>

        <div className="py-6">
          {tab === 'detail' ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <dl className="m-0 grid grid-cols-[120px_minmax(0,1fr)] gap-x-4 gap-y-4 text-sm">
                <dt className="text-gf-muted">{t.category}</dt>
                <dd className="m-0 font-medium text-gf-brown-900">
                  {product.category?.name ?? '-'}
                </dd>
                <dt className="text-gf-muted">{t.brand}</dt>
                <dd className="m-0 font-medium text-gf-brown-900">
                  {product.brand?.name ?? '-'}
                </dd>
                <dt className="text-gf-muted">{t.model}</dt>
                <dd className="m-0 font-medium text-gf-brown-900">{product.model ?? '-'}</dd>
                <dt className="text-gf-muted">{t.condition}</dt>
                <dd className="m-0 leading-6 text-gf-brown-700">
                  {product.conditionNote ?? '-'}
                </dd>
              </dl>

              <div>
                <h2 className="m-0 flex items-center gap-2 text-base font-bold text-gf-brown-900">
                  <PackageCheck size={19} className="text-gf-pink-600" />
                  {t.includedAccessories}
                </h2>
                {product.accessories?.length ? (
                  <ul className="mt-3 divide-y divide-gf-pink-100 border-y border-gf-pink-100">
                    {product.accessories.map((accessory) => (
                      <li
                        key={accessory.id}
                        className="flex min-h-11 items-center justify-between gap-4 py-2 text-sm"
                      >
                        <span className="text-gf-brown-700">{accessory.name}</span>
                        <span className="shrink-0 font-semibold text-gf-brown-900">
                          {t.quantity} {accessory.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gf-muted">{t.noAccessories}</p>
                )}
              </div>

              {product.extraDetails && (
                <div className="lg:col-span-2">
                  <h2 className="m-0 text-base font-bold text-gf-brown-900">{t.extraDetails}</h2>
                  <p className="mt-2 text-sm leading-7 text-gf-brown-700">
                    {product.extraDetails}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <ul className="m-0 grid list-none gap-3 p-0 text-sm leading-7 text-gf-brown-700 md:grid-cols-2">
              {[t.policyStart, t.policyReturn, t.policyExtend, t.policyLate].map((policy) => (
                <li key={policy} className="flex items-start gap-3">
                  <ShieldCheck size={18} className="mt-1 shrink-0 text-gf-pink-600" />
                  <span>{policy}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <ProductMediaLightbox
        media={media}
        productName={product.name}
        initialIndex={previewIndex}
        onIndexChange={setPreviewIndex}
        onOpenChange={(open) => { if (!open) setPreviewIndex(null) }}
      />
    </div>
  );
}
