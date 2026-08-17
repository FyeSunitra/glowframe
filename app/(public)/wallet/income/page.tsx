'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { Pagination } from '@/components/common/Pagination'
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn } from '@/lib/utils'
import { walletService } from '@/services/wallet'
import { useAppStore } from '@/store/appStore'

type Direction = '' | 'incoming' | 'outgoing'

export default function WalletIncomePage() {
  const t = getPageText(useAppStore((state) => state.locale), 'wallet')
  const [direction, setDirection] = useState<Direction>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const filters = { direction, page, limit }
  const { data, isLoading, isError } = useQuery({ queryKey: ['wallet', filters], queryFn: () => walletService.get(filters).then(unwrapApiResponse) })
  return <div className="animate-fade-up">
    <Breadcrumb items={[t.title, t.history]} />
    <div className="mb-5 flex flex-wrap gap-2">{([{ value: '', label: t.allFilter }, { value: 'incoming', label: t.incomingFilter }, { value: 'outgoing', label: t.outgoingFilter }] as const).map((item) => <button key={item.value} type="button" onClick={() => { setDirection(item.value); setPage(1) }} className={cn('cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold', direction === item.value ? 'border-gf-brown-800 bg-gf-brown-800 text-white' : 'border-gf-line bg-white text-gf-brown-700')}>{item.label}</button>)}</div>
    <section className="bg-white">
      {isLoading ? <div className="py-16 text-center text-gf-muted">{t.loading}</div> : isError || !data ? <div className="py-16 text-center text-gf-red">{t.loadFailed}</div> : <><TransactionHistory items={data.transactions} />{data.meta.total > 0 && <Pagination {...data.meta} onPageChange={setPage} onLimitChange={(value) => { setLimit(value); setPage(1) }} />}</>}
    </section>
  </div>
}
