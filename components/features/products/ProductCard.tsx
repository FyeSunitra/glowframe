'use client'

import Image from 'next/image'
import Link from 'next/link'

import { CameraGlyph } from '@/components/common/CameraGlyph'
import { translateText } from '@/lib/menuI18n'
import { money } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const locale = useAppStore((state) => state.locale)
  const mainImage = product.media?.find((item) => item.mediaType === 'image')

  return (
    <Link
      href={`/for-rent/${product.id}`}
      className="block cursor-pointer overflow-hidden rounded-[8px] bg-white no-underline shadow-[var(--gf-shadow-sm)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[var(--gf-shadow)]"
    >
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={{ background: `${product.color}20` }}
      >
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-cover"
          />
        ) : (
          <CameraGlyph color={product.color} size={76} />
        )}
      </div>

      <div className="p-[16px_18px_18px]">
        <h3 className="m-0 mb-1.5 text-[14.5px] font-semibold leading-[1.4] text-gf-brown-900">
          {product.name}
        </h3>
        <p className="m-0 mb-2.5 line-clamp-2 min-h-[38px] text-[12.5px] leading-[1.5] text-gf-muted">
          {product.desc}
        </p>
        <div className="text-[15px] font-bold text-gf-brown-900">
          {money(product.price)} THB / {locale === 'th' ? '1 วัน' : '1 Day'}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-gf-yellow">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-xs font-semibold text-gf-brown-700 underline">
            {translateText(locale, 'More Info.')}
          </span>
        </div>
      </div>
    </Link>
  )
}
