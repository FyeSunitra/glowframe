'use client'

import { useQuery } from '@tanstack/react-query'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { ProductCard } from '@/components/features/products/ProductCard'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { productService } from '@/services/products'
import { useAppStore } from '@/store/appStore'

export default function ForRentPage() {
  const t = getPageText(useAppStore((state) => state.locale), 'catalog')
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'public', 'guest-catalog'],
    queryFn: async () => unwrapApiResponse(await productService.list()),
    refetchOnMount: 'always',
  })

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.allProducts]} />
      {isLoading ? (
        <div className="py-16 text-center text-gf-muted">{t.loading}</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-sm text-gf-muted">{t.notFound}</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
