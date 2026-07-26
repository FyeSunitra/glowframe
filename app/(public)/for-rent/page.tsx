'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Breadcrumb } from '@/components/common/Breadcrumb';
import { ProductCard } from '@/components/features/products/ProductCard';
import type { Product } from '@/types';
import { getPageText } from '@/lib/menuI18n';
import { useAppStore } from '@/store/appStore';

async function fetchProducts(): Promise<Product[]> {
  const { data } = await axios.get('/api/products');
  return data.data;
}

export default function ForRentPage() {
  const t = getPageText(useAppStore((s) => s.locale), 'catalog');
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  return (
    <div className="animate-fade-up">
      <Breadcrumb items={[t.allProducts]} />
      {isLoading ? (
        <div className="text-gf-muted text-center [padding:60px]">
          {t.loading}
        </div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,_minmax(230px,_1fr))] gap-[20px]">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
