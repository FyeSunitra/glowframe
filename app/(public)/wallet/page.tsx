'use client'

import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Breadcrumb } from '@/components/common/Breadcrumb'
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory'
import { WalletHero } from '@/components/features/wallet/WalletHero'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { walletService } from '@/services/wallet'
import { useAppStore } from '@/store/appStore'

export default function WalletPage() {
  const t = getPageText(useAppStore((state) => state.locale), 'wallet')
  const router = useRouter()
  const { data, isLoading, isError } = useQuery({ queryKey: ['wallet', { limit: 3 }], queryFn: () => walletService.get({ limit: 3 }).then(unwrapApiResponse) })
  return <div className="animate-fade-up">
    <Breadcrumb items={[t.title]} />
    {isLoading ? <div className="py-16 text-center text-gf-muted">{t.loading}</div> : isError || !data ? <div className="py-16 text-center text-gf-red">{t.loadFailed}</div> : <>
      <WalletHero balance={data.balance} availableBalance={data.availableBalance} pendingWithdrawal={data.pendingWithdrawal} />
      <section className="mt-5 bg-white py-5 sm:px-1">
        <div className="mb-2 flex items-center justify-between gap-4"><h2 className="text-lg font-bold text-gf-brown-900">{t.recentTransactions}</h2><button type="button" onClick={() => router.push('/wallet/income')} className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent text-sm font-semibold text-gf-brown-700">{t.all}<ChevronRight size={15} /></button></div>
        <TransactionHistory items={data.transactions} />
      </section>
    </>}
  </div>
}
