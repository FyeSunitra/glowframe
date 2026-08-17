'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { TransactionHistory } from '@/components/features/wallet/TransactionHistory'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { money } from '@/lib/utils'
import { walletService } from '@/services/wallet'
import { useAppStore } from '@/store/appStore'

export default function WalletWithdrawPage() {
  const t = getPageText(useAppStore((state) => state.locale), 'wallet')
  const router = useRouter()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { data: wallet } = useQuery({ queryKey: ['wallet', 'withdraw'], queryFn: () => walletService.get({ limit: 50 }).then(unwrapApiResponse) })
  const { data: accounts = [] } = useQuery({ queryKey: ['wallet', 'bank-accounts'], queryFn: () => walletService.bankAccounts().then(unwrapApiResponse) })
  const approvedAccounts = accounts.filter((item) => item.verificationStatus === 'approved')
  const selectedId = accountId || String(approvedAccounts.find((item) => item.isDefault)?.id ?? approvedAccounts[0]?.id ?? '')
  const numericAmount = Number(amount)
  const canSubmit = !!selectedId && agreed && numericAmount > 0 && numericAmount <= (wallet?.availableBalance ?? 0)
  const mutation = useMutation({
    mutationFn: () => walletService.withdraw({ bankAccountId: Number(selectedId), amount: numericAmount }).then(unwrapApiResponse),
    onSuccess: () => { setAmount(''); setAgreed(false); void queryClient.invalidateQueries({ queryKey: ['wallet'] }); showToast(t.requestSubmitted) },
    onError: (error) => showToast(error instanceof Error ? error.message : t.loadFailed),
  })
  const withdrawals = wallet?.transactions.filter((item) => item.type === 'withdrawal') ?? []
  return <div className="animate-fade-up">
    <Breadcrumb items={[t.title, t.withdraw]} />
    <div className="grid gap-8 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <section>
        <div className="mb-5 flex items-center justify-between border-b border-gf-line pb-4"><div><div className="text-sm text-gf-muted">{t.availableBalance}</div><div className="mt-1 font-[var(--font-poppins)] text-2xl font-bold text-gf-brown-900">฿{money(wallet?.availableBalance ?? 0)}</div></div><button type="button" onClick={() => router.push('/wallet/bank')} className="cursor-pointer rounded-full border border-gf-line bg-white px-4 py-2 text-sm font-semibold text-gf-brown-700">{t.manageAccounts}</button></div>
        {approvedAccounts.length === 0 ? <button type="button" onClick={() => router.push('/wallet/bank')} className="flex w-full cursor-pointer items-center gap-3 rounded-[8px] border border-dashed border-gf-brown-300 bg-white p-5 text-left"><Building2 className="text-gf-brown-500" /><span><b className="block text-gf-brown-900">{accounts.length === 0 ? t.noBankAccounts : t.bankVerificationPending}</b><span className="mt-1 block text-sm text-gf-muted">{accounts.length === 0 ? t.addAccountFirst : t.approvedAccountRequired}</span></span></button> : <>
          <div className="mb-4"><Label className="mb-2">{t.chooseAccount}</Label><Select value={selectedId} onValueChange={(value) => setAccountId(value ?? '')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{approvedAccounts.map((account) => <SelectItem key={account.id} value={String(account.id)}>{account.bank.abbreviation} · {account.accountNumberMasked}</SelectItem>)}</SelectContent></Select></div>
          <div className="mb-4"><Label className="mb-2">{t.withdrawalAmount}</Label><Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-6 text-gf-brown-700"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1" /><span>{t.agreement}</span></label>
          <button type="button" disabled={!canSubmit || mutation.isPending} onClick={() => setConfirmOpen(true)} className="mt-5 w-full cursor-pointer rounded-full border-0 bg-gf-pink-500 px-5 py-3 font-semibold text-gf-brown-900 disabled:cursor-not-allowed disabled:opacity-45">{mutation.isPending ? t.submitting : t.submitWithdrawal}</button>
        </>}
      </section>
      <section><h2 className="mb-2 text-lg font-bold text-gf-brown-900">{t.withdrawalHistory}</h2><TransactionHistory items={withdrawals} /></section>
    </div>
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title={t.submitWithdrawal} description={`${t.withdrawalAmount} ฿${money(numericAmount)}`} onConfirm={() => { setConfirmOpen(false); mutation.mutate() }} />
  </div>
}
