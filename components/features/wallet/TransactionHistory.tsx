'use client'

import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react'

import { getPageText } from '@/lib/menuI18n'
import { cn, money } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import type { WalletTransactionItem } from '@/types/wallet'

interface TransactionHistoryProps {
  items: WalletTransactionItem[]
}

export function TransactionHistory({ items }: TransactionHistoryProps) {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'wallet')
  const dateTime = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  if (items.length === 0) return <div className="py-12 text-center"><ReceiptText className="mx-auto text-gf-brown-300" size={28} /><div className="mt-3 font-semibold text-gf-brown-800">{t.noTransactions}</div><div className="mt-1 text-sm text-gf-muted">{t.noTransactionsSub}</div></div>
  return <div className="divide-y divide-gf-line">{items.map((item) => {
    const incoming = item.direction === 'incoming'
    return <div key={item.id} className="flex items-start gap-3 py-4">
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', incoming ? 'bg-[#DFF2E0] text-gf-green' : 'bg-[#FAE0DA] text-gf-red')}>{incoming ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div><div className="font-semibold text-gf-brown-900">{t.transactionTypes[item.type]}</div><div className="mt-0.5 text-xs text-gf-muted">{item.productName ?? item.description ?? t.transactions}</div></div>
          <div className={cn('whitespace-nowrap font-[var(--font-poppins)] font-bold', incoming ? 'text-gf-green' : 'text-gf-red')}>{incoming ? '+' : '-'} ฿{money(item.amount)}</div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gf-muted">
          <span>{dateTime.format(new Date(item.createdAt))}</span>
          {item.bookingNo && <span>{t.bookingNo} #{item.bookingNo}</span>}
          <span className="rounded-full bg-gf-pink-100 px-2 py-0.5 font-medium text-gf-brown-700">{t.transactionStatuses[item.status as keyof typeof t.transactionStatuses] ?? item.status}</span>
        </div>
      </div>
    </div>
  })}</div>
}
