'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Pencil, Plus, Star, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { publicMasterDataService } from '@/services/masterData'
import { walletService } from '@/services/wallet'
import { useAppStore } from '@/store/appStore'
import type { UserBankAccount } from '@/types/wallet'

interface AccountForm { bankId: string; accountName: string; accountNumber: string; isDefault: boolean }
const EMPTY_FORM: AccountForm = { bankId: '', accountName: '', accountNumber: '', isDefault: false }

export default function WalletBankPage() {
  const t = getPageText(useAppStore((state) => state.locale), 'wallet')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UserBankAccount | null>(null)
  const [deleting, setDeleting] = useState<UserBankAccount | null>(null)
  const [form, setForm] = useState<AccountForm>(EMPTY_FORM)
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ['wallet', 'bank-accounts'], queryFn: () => walletService.bankAccounts().then(unwrapApiResponse) })
  const { data: bankResult } = useQuery({ queryKey: ['master', 'banks', 'wallet'], queryFn: () => publicMasterDataService.banks.list({ limit: 50 }).then(unwrapApiResponse) })
  const banks = bankResult?.items ?? []
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { bankId: Number(form.bankId), accountName: form.accountName.trim(), ...(form.accountNumber ? { accountNumber: form.accountNumber } : {}), isDefault: form.isDefault }
      return (editing ? walletService.updateBankAccount(editing.id, payload) : walletService.addBankAccount(payload)).then(unwrapApiResponse)
    },
    onSuccess: () => { setDialogOpen(false); void queryClient.invalidateQueries({ queryKey: ['wallet', 'bank-accounts'] }); showToast(t.accountSaved) },
    onError: (error) => showToast(error instanceof Error ? error.message : t.loadFailed),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: number) => walletService.deleteBankAccount(id).then(unwrapApiResponse),
    onSuccess: () => { setDeleting(null); void queryClient.invalidateQueries({ queryKey: ['wallet', 'bank-accounts'] }); showToast(t.accountDeleted) },
    onError: (error) => showToast(error instanceof Error ? error.message : t.loadFailed),
  })
  const defaultMutation = useMutation({
    mutationFn: (account: UserBankAccount) => walletService.updateBankAccount(account.id, {
      bankId: account.bank.id,
      accountName: account.accountName,
      isDefault: true,
    }).then(unwrapApiResponse),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['wallet', 'bank-accounts'] }); showToast(t.accountSaved) },
    onError: (error) => showToast(error instanceof Error ? error.message : t.loadFailed),
  })
  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setDialogOpen(true) }
  function openEdit(account: UserBankAccount) { setEditing(account); setForm({ bankId: String(account.bank.id), accountName: account.accountName, accountNumber: '', isDefault: account.isDefault }); setDialogOpen(true) }
  function save() {
    if (!form.bankId) return showToast(t.bankRequired)
    if (form.accountName.trim().length < 2) return showToast(t.accountNameRequired)
    if (!editing && !/^\d{6,20}$/.test(form.accountNumber.replace(/\D/g, ''))) return showToast(t.accountNumberRequired)
    saveMutation.mutate()
  }
  return <div className="animate-fade-up">
    <Breadcrumb items={[t.title, t.manageAccounts]} />
    <div className="mb-5 flex items-center justify-between gap-4"><div><h1 className="text-xl font-bold text-gf-brown-900">{t.savedAccounts}</h1><p className="mt-1 text-sm text-gf-muted">{t.addAccountFirst}</p></div><button type="button" onClick={openCreate} className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-gf-pink-500 px-4 py-2.5 text-sm font-semibold text-gf-brown-900"><Plus size={16} />{t.addAccount}</button></div>
    {isLoading ? <div className="py-16 text-center text-gf-muted">{t.loading}</div> : accounts.length === 0 ? <div className="rounded-[8px] border border-dashed border-gf-line py-14 text-center"><Building2 className="mx-auto text-gf-brown-300" /><div className="mt-3 font-semibold text-gf-brown-800">{t.noBankAccounts}</div></div> : <div className="grid gap-3 md:grid-cols-2">{accounts.map((account) => <article key={account.id} className="rounded-[8px] border border-gf-line bg-white p-5">
      <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gf-pink-100"><Building2 size={19} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 font-semibold text-gf-brown-900">{account.bank.name}{account.isDefault && <span className="rounded-full bg-[#FEF3CD] px-2 py-0.5 text-[11px] text-gf-yellow">{t.defaultAccount}</span>}</div><div className="mt-1 font-[var(--font-poppins)] text-sm text-gf-muted">{account.accountNumberMasked}</div><div className="mt-0.5 text-sm text-gf-brown-700">{account.accountName}</div><div className="mt-2 text-xs font-semibold text-gf-brown-600">{account.verificationStatus === 'approved' ? t.bankVerificationApproved : account.verificationStatus === 'rejected' ? t.bankVerificationRejected : t.bankVerificationPending}</div>{account.verificationReason && <div className="mt-1 text-xs text-gf-red">{account.verificationReason}</div>}</div></div><div className="flex shrink-0 gap-1"><button type="button" title={t.editAccount} onClick={() => openEdit(account)} className="flex size-9 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-gf-brown-600"><Pencil size={16} /></button><button type="button" title={t.deleteAccount} onClick={() => setDeleting(account)} className="flex size-9 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-gf-red"><Trash2 size={16} /></button></div></div>
      {!account.isDefault && <button type="button" onClick={() => defaultMutation.mutate(account)} className="mt-4 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-semibold text-gf-brown-700"><Star size={14} />{t.setDefault}</button>}
    </article>)}</div>}

    <FormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? t.editAccount : t.addAccount} submitLabel={t.saveAccount} onSubmit={save}>
      <div className="space-y-4">
        <div><Label className="mb-2">{t.destinationBank}</Label><Select value={form.bankId} onValueChange={(value) => setForm((current) => ({ ...current, bankId: value ?? '' }))}><SelectTrigger><SelectValue placeholder={t.selectBank} /></SelectTrigger><SelectContent>{banks.map((bank) => <SelectItem key={bank.id} value={String(bank.id)}>{bank.abbreviation} · {bank.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="mb-2">{t.accountName}</Label><Input value={form.accountName} onChange={(event) => setForm((current) => ({ ...current, accountName: event.target.value }))} /></div>
        <div><Label className="mb-2">{t.accountNumber}</Label><Input inputMode="numeric" value={form.accountNumber} onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))} placeholder={editing ? editing.accountNumberMasked : '0000000000'} /></div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gf-brown-700"><input type="checkbox" checked={form.isDefault} onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))} />{t.setDefault}</label>
      </div>
    </FormDialog>
    <ConfirmDialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null) }} title={t.deleteAccount} description={deleting ? `${deleting.bank.name} ${deleting.accountNumberMasked}` : ''} destructive onConfirm={() => { if (deleting) deleteMutation.mutate(deleting.id) }} />
  </div>
}
