'use client'

import { ArrowDownToLine, Building2, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { getPageText } from '@/lib/menuI18n'
import { money } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

interface WalletHeroProps {
  balance: number
  availableBalance?: number
  pendingWithdrawal?: number
  onWithdraw?: () => void
}

export function WalletHero({ balance, availableBalance = balance, pendingWithdrawal = 0, onWithdraw }: WalletHeroProps) {
  const router = useRouter()
  const t = getPageText(useAppStore((state) => state.locale), 'wallet')
  return (
    <section className="overflow-hidden rounded-[8px] bg-gf-brown-800 p-5 text-white sm:p-7">
      <div className="text-sm text-gf-pink-300">{t.totalBalance}</div>
      <div className="mt-2 font-[var(--font-poppins)] text-[36px] font-bold sm:text-[42px]">฿{money(balance)}</div>
      <div className="mt-5 grid gap-3 border-t border-white/15 pt-4 sm:grid-cols-2">
        <BalanceDetail label={t.availableBalanceLabel} value={availableBalance} />
        <BalanceDetail label={t.pendingWithdrawalLabel} value={pendingWithdrawal} />
      </div>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button type="button" onClick={onWithdraw ?? (() => router.push('/wallet/withdraw'))} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-gf-pink-500 px-4 py-2.5 text-sm font-semibold text-gf-brown-900"><ArrowDownToLine size={16} />{t.withdraw}</button>
        <button type="button" onClick={() => router.push('/wallet/bank')} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/25 bg-transparent px-4 py-2.5 text-sm font-semibold text-white"><Building2 size={16} />{t.manageAccounts}<ChevronRight size={14} /></button>
      </div>
    </section>
  )
}

function BalanceDetail({ label, value }: { label: string; value: number }) {
  return <div><div className="text-xs text-gf-pink-300">{label}</div><div className="mt-1 font-[var(--font-poppins)] text-lg font-semibold">฿{money(value)}</div></div>
}
