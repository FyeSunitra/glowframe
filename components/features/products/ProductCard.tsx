'use client';

import Link from 'next/link';
import { CameraGlyph } from '@/components/common/CameraGlyph';
import { money } from '@/lib/utils';
import { translateText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const stars = '★'.repeat(product.rating);
  const locale = useAppStore((s) => s.locale);

  return (
    <Link
      href={`/for-rent/${product.id}`}
      className="block cursor-pointer overflow-hidden rounded-[22px] bg-white no-underline shadow-[var(--gf-shadow-sm)] transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[var(--gf-shadow)]"
    >
      {/* Thumb */}
      <div className="flex h-[150px] items-center justify-center" style={{ background: `${product.color}20` }}>
        <CameraGlyph color={product.color} size={76} />
      </div>

      {/* Info */}
      <div className="[padding:16px_18px_18px]">
        <h3 className="text-[14.5px] [margin:0_0_6px] font-semibold [line-height:1.4] text-gf-brown-900">{product.name}</h3>
        <p className="text-[12.5px] text-gf-muted [margin:0_0_10px] [line-height:1.5] h-[34px] overflow-hidden">{product.desc}</p>
        <div className="font-bold text-gf-brown-900 text-[15px]">
          {money(product.price)} THB / {locale === 'th' ? '1 วัน' : '1 Day'}
        </div>
        <div className="flex justify-between items-center [margin-top:8px]">
          <span className="text-gf-yellow text-[13px] [letter-spacing:1px]">{stars}</span>
          <span className="text-[12px] text-gf-brown-700 underline font-semibold">
            {translateText(locale, 'More Info.')}
          </span>
        </div>
      </div>
    </Link>
  );
}
