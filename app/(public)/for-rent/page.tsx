'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { LoadingState } from '@/components/common/LoadingState'
import { ProductCard } from '@/components/features/products/ProductCard'
import { RentalAgreementGateDialog } from '@/components/features/products/RentalAgreementGateDialog'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { productService } from '@/services/products'
import { policyService } from '@/services/policy'
import { useAppStore } from '@/store/appStore'

export default function ForRentPage() {
  const locale = useAppStore((state) => state.locale)
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const t = getPageText(locale, 'catalog')
  const [rentalAgreementDismissed, setRentalAgreementDismissed] = useState(false)
  const [rentalAgreementAccepted, setRentalAgreementAccepted] = useState(false)
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'public', 'guest-catalog'],
    queryFn: async () => unwrapApiResponse(await productService.list()),
    refetchOnMount: 'always',
  })
  const { data: rentalAgreementStatus } = useQuery({
    queryKey: ['policies', 'rental-agreement', 'acceptance'],
    queryFn: async () => unwrapApiResponse(await policyService.getRentalAcceptanceStatus()),
    enabled: isAuthenticated,
    retry: false,
  })
  const rentalAgreementOpen = isAuthenticated
    && !rentalAgreementDismissed
    && !rentalAgreementAccepted
    && rentalAgreementStatus?.accepted === false

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.allProducts]} />
      <RentalAgreementGateDialog
        open={rentalAgreementOpen}
        onOpenChange={(open) => setRentalAgreementDismissed(!open)}
        onAccepted={() => setRentalAgreementAccepted(true)}
      />
      {isLoading ? (
        <LoadingState label={t.loading} />
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
