'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, DollarSign, Eye, EyeOff, MoreHorizontal, TrendingUp, Wallet } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DataTable } from '@/components/admin/shared/DataTable'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { PillTabs } from '@/components/admin/shared/PillTabs'
import { StatCard } from '@/components/admin/shared/StatCard'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { Pagination } from '@/components/common/Pagination'
import { ProductMediaLightbox } from '@/components/features/products/ProductMediaLightbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { money } from '@/lib/utils'
import { adminPayoutService } from '@/services/adminPayouts'
import { useAppStore } from '@/store/appStore'
import type { AdminBankAccount, AdminPayout } from '@/types/adminPayout'

type View = 'accounts' | 'pending' | 'history'

export default function PayoutsPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminPayouts')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('accounts')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [payout, setPayout] = useState<AdminPayout | null>(null)
  const [account, setAccount] = useState<AdminBankAccount | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [approveAccountOpen, setApproveAccountOpen] = useState(false)
  const [rejectAccountOpen, setRejectAccountOpen] = useState(false)
  const [approvePayoutOpen, setApprovePayoutOpen] = useState(false)
  const [rejectPayoutOpen, setRejectPayoutOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [reference, setReference] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [revealedNumber, setRevealedNumber] = useState<string | null>(null)
  const [proofIndex, setProofIndex] = useState<number | null>(null)
  const payoutFilters = { tab: view === 'history' ? 'history' as const : 'pending' as const, search, page, limit }
  const accountFilters = { tab: 'pending' as const, search, page, limit }
  const payoutQuery = useQuery({ queryKey: ['admin', 'payouts', payoutFilters], queryFn: () => adminPayoutService.list(payoutFilters).then(unwrapApiResponse), enabled: view !== 'accounts' })
  const accountQuery = useQuery({ queryKey: ['admin', 'payout-accounts', accountFilters], queryFn: () => adminPayoutService.bankAccounts(accountFilters).then(unwrapApiResponse), enabled: view === 'accounts' })
  const dateTime = new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })

  const reviewPayout = useMutation({
    mutationFn: ({ item, action }: { item: AdminPayout; action: 'approve' | 'reject' }) => adminPayoutService.review(item.id, action === 'approve' ? { action, proof: proof!, reference: reference.trim() || undefined, note: transferNote.trim() || undefined } : { action, reason: reason.trim() }).then(unwrapApiResponse),
    onSuccess: (_item, variables) => { void queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] }); void queryClient.invalidateQueries({ queryKey: ['wallet'] }); setDrawerOpen(false); showToast(variables.action === 'approve' ? t.approvedToast : t.rejectedToast) },
    onError: (error) => showToast(error instanceof Error ? error.message : t.reviewFailed),
  })
  const reviewAccount = useMutation({
    mutationFn: ({ item, action }: { item: AdminBankAccount; action: 'approve' | 'reject' }) => adminPayoutService.reviewBankAccount(item.id, action, reason.trim() || undefined).then(unwrapApiResponse),
    onSuccess: (_item, variables) => { void queryClient.invalidateQueries({ queryKey: ['admin', 'payout-accounts'] }); void queryClient.invalidateQueries({ queryKey: ['wallet', 'bank-accounts'] }); setDrawerOpen(false); showToast(variables.action === 'approve' ? t.accountApproved : t.accountRejected) },
    onError: (error) => showToast(error instanceof Error ? error.message : t.reviewFailed),
  })
  const reveal = useMutation({
    mutationFn: (id: number) => adminPayoutService.revealBankAccount(id).then(unwrapApiResponse),
    onSuccess: (data) => setRevealedNumber(data.accountNumber),
    onError: (error) => showToast(error instanceof Error ? error.message : t.reviewFailed),
  })

  function changeView(label: string) {
    setView(label === t.accountVerification ? 'accounts' : label === t.history ? 'history' : 'pending')
    setSearch(''); setPage(1); setDrawerOpen(false)
  }
  function openAccount(item: AdminBankAccount) { setAccount(item); setPayout(null); setRevealedNumber(null); setDrawerOpen(true) }
  function openPayout(item: AdminPayout) { setPayout(item); setAccount(null); setRevealedNumber(null); setDrawerOpen(true) }
  const payoutData = payoutQuery.data
  const activeData = view === 'accounts' ? accountQuery.data : payoutData

  const accountColumns = [
    { key: 'user', header: t.owner, render: (item: AdminBankAccount) => <UserCell name={item.user.displayName} email={item.user.email} /> },
    { key: 'accountName', header: t.accountName },
    { key: 'bank', header: t.bankAccount, render: (item: AdminBankAccount) => `${item.bank.abbreviation} · ${item.accountNumberMasked}` },
    { key: 'createdAt', header: t.requested, render: (item: AdminBankAccount) => <DateCell value={item.createdAt} formatter={dateTime} /> },
    { key: 'status', header: t.status, render: (item: AdminBankAccount) => <StatusBadge status={item.status} /> },
    { key: 'actions', header: '', render: (item: AdminBankAccount) => <RowMenu label={t.view} onView={() => openAccount(item)} /> },
  ]
  const payoutColumns = [
    { key: 'user', header: t.owner, render: (item: AdminPayout) => <UserCell name={item.user.displayName} email={item.user.email} /> },
    { key: 'amount', header: t.payoutAmount, render: (item: AdminPayout) => <b className="font-[var(--font-poppins)]">฿{money(item.amount)}</b> },
    { key: 'bank', header: t.bankAccount, render: (item: AdminPayout) => <div>{item.bankAccount.abbreviation} · {item.bankAccount.accountNumberMasked}<div className="text-xs text-gf-muted">{item.bankAccount.accountName}</div></div> },
    { key: 'requestedAt', header: t.requested, render: (item: AdminPayout) => <DateCell value={item.requestedAt} formatter={dateTime} /> },
    { key: 'status', header: t.status, render: (item: AdminPayout) => <StatusBadge status={item.status} /> },
    { key: 'actions', header: '', render: (item: AdminPayout) => <RowMenu label={t.view} onView={() => openPayout(item)} /> },
  ]

  return <div className="animate-fade-up">
    <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><StatCard icon={DollarSign} label={t.totalPaid} value={`${money(payoutData?.stats.totalPaid ?? 0)} THB`} /><StatCard icon={Clock} label={t.pendingRequests} value={payoutData?.stats.pendingCount ?? 0} /><StatCard icon={TrendingUp} label={t.thisMonth} value={`${money(payoutData?.stats.thisMonth ?? 0)} THB`} /></div>
    <PillTabs items={[t.accountVerification, t.payoutRequests, t.history]} value={view === 'accounts' ? t.accountVerification : view === 'history' ? t.history : t.payoutRequests} onChange={changeView} />
    <FilterBar search={{ placeholder: t.search, value: search, onChange: (value) => { setSearch(value); setPage(1) } }} />
    {view === 'accounts' ? <DataTable columns={accountColumns} data={accountQuery.data?.items ?? []} loading={accountQuery.isLoading} onRowClick={openAccount} empty={<EmptyState icon={Wallet} heading={t.noPending} sub={t.emptySub} />} /> : <DataTable columns={payoutColumns} data={payoutData?.items ?? []} loading={payoutQuery.isLoading} onRowClick={openPayout} empty={<EmptyState icon={Wallet} heading={view === 'pending' ? t.noPending : t.noHistory} sub={t.emptySub} />} />}
    {activeData && activeData.meta.total > 0 && <Pagination {...activeData.meta} onPageChange={setPage} onLimitChange={(value) => { setLimit(value); setPage(1) }} />}

    <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={account?.user.displayName ?? payout?.user.displayName ?? ''} subtitle={account ? account.bank.name : payout ? `${payout.bankAccount.abbreviation} · ${payout.bankAccount.accountNumberMasked}` : undefined} footer={account?.status === 'pending' ? <ActionPair reject={t.rejectAccount} approve={t.approveAccount} onReject={() => { setReason(''); setRejectAccountOpen(true) }} onApprove={() => setApproveAccountOpen(true)} /> : payout?.status === 'pending' ? <ActionPair reject={t.reject} approve={t.approve} onReject={() => { setReason(''); setRejectPayoutOpen(true) }} onApprove={() => { setProof(null); setReference(''); setTransferNote(''); setApprovePayoutOpen(true) }} /> : undefined}>
      {account && <div><Details rows={[[t.userName, account.user.displayName], [t.verifiedName, account.user.fullName ?? '-'], [t.email, account.user.email], [t.bank, account.bank.name], [t.accountName, account.accountName], [t.account, revealedNumber ?? account.accountNumberMasked], [t.requested, dateTime.format(new Date(account.createdAt))]]} /><RevealButton revealed={!!revealedNumber} loading={reveal.isPending} labels={t} onClick={() => revealedNumber ? setRevealedNumber(null) : reveal.mutate(account.id)} /></div>}
      {payout && <div><Details rows={[[t.email, payout.user.email], [t.payoutAmount, `฿${money(payout.amount)}`], [t.bank, payout.bankAccount.bankName], [t.accountName, payout.bankAccount.accountName], [t.account, revealedNumber ?? payout.bankAccount.accountNumberMasked], [t.requested, dateTime.format(new Date(payout.requestedAt))], ...(payout.transferReference ? [[t.transferReference, payout.transferReference]] : []), ...(payout.transferredAt ? [[t.transferredAt, dateTime.format(new Date(payout.transferredAt))]] : []), ...(payout.rejectionReason ? [[t.reason, payout.rejectionReason]] : [])]} /><RevealButton revealed={!!revealedNumber} loading={reveal.isPending} labels={t} onClick={() => revealedNumber ? setRevealedNumber(null) : reveal.mutate(payout.bankAccount.id)} />{payout.transferProofUrl && <button type="button" onClick={() => setProofIndex(0)} className="mt-5 w-full cursor-pointer rounded-[8px] border border-gf-line bg-white p-3 text-left text-sm font-semibold text-gf-brown-800">{t.transferProof}: {payout.transferProofFileName}</button>}</div>}
    </DetailDrawer>

    <ConfirmDialog open={approveAccountOpen} onOpenChange={setApproveAccountOpen} title={t.approveAccount} description={account ? `${account.bank.name} ${account.accountNumberMasked}` : ''} onConfirm={() => { if (account) reviewAccount.mutate({ item: account, action: 'approve' }); setApproveAccountOpen(false) }} />
    <RejectDialog open={rejectAccountOpen} onOpenChange={setRejectAccountOpen} title={t.rejectAccount} labels={t} reason={reason} setReason={setReason} onSubmit={() => { if (!reason.trim()) return showToast(t.reasonRequired); if (account) reviewAccount.mutate({ item: account, action: 'reject' }); setRejectAccountOpen(false) }} />
    <RejectDialog open={rejectPayoutOpen} onOpenChange={setRejectPayoutOpen} title={t.rejectTitle} labels={t} reason={reason} setReason={setReason} onSubmit={() => { if (!reason.trim()) return showToast(t.reasonRequired); if (payout) reviewPayout.mutate({ item: payout, action: 'reject' }); setRejectPayoutOpen(false) }} />
    <FormDialog open={approvePayoutOpen} onOpenChange={setApprovePayoutOpen} title={t.transferConfirmation} submitLabel={t.approve} onSubmit={() => { if (!proof) return showToast(t.proofRequired); if (payout) reviewPayout.mutate({ item: payout, action: 'approve' }); setApprovePayoutOpen(false) }}><div className="space-y-4"><div><Label className="mb-2">{t.uploadTransferProof}</Label><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProof(event.target.files?.[0] ?? null)} /></div><div><Label className="mb-2">{t.transferReference}</Label><Input value={reference} onChange={(event) => setReference(event.target.value)} /></div><div><Label className="mb-2">{t.transferNote}</Label><Textarea value={transferNote} onChange={(event) => setTransferNote(event.target.value)} /></div></div></FormDialog>
    <ProductMediaLightbox media={payout?.transferProofUrl ? [{ id: payout.id, mediaType: 'image', url: payout.transferProofUrl }] : []} productName={t.transferProof} initialIndex={proofIndex} onIndexChange={setProofIndex} onOpenChange={(open) => { if (!open) setProofIndex(null) }} />
  </div>
}

function UserCell({ name, email }: { name: string; email: string }) { return <div><div className="font-semibold text-gf-brown-900">{name}</div><div className="text-xs text-gf-muted">{email}</div></div> }
function DateCell({ value, formatter }: { value: string; formatter: Intl.DateTimeFormat }) { return <span className="whitespace-nowrap text-xs text-gf-muted">{formatter.format(new Date(value))}</span> }
function RowMenu({ label, onView }: { label: string; onView: () => void }) { return <DropdownMenu><DropdownMenuTrigger aria-label={label} onClick={(event) => event.stopPropagation()} className="cursor-pointer rounded-[8px] border-0 bg-transparent p-2"><MoreHorizontal size={16} /></DropdownMenuTrigger><DropdownMenuContent side="bottom" align="end"><DropdownMenuItem onClick={onView}>{label}</DropdownMenuItem></DropdownMenuContent></DropdownMenu> }
function Details({ rows }: { rows: string[][] }) { return <div className="divide-y divide-gf-line">{rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 py-3 text-sm"><span className="text-gf-muted">{label}</span><span className="break-all text-right font-medium text-gf-brown-900">{value}</span></div>)}</div> }
function ActionPair({ reject, approve, onReject, onApprove }: { reject: string; approve: string; onReject: () => void; onApprove: () => void }) { return <div className="flex gap-2"><button type="button" onClick={onReject} className="flex-1 cursor-pointer rounded-full border border-gf-red bg-white px-3 py-2.5 font-semibold text-gf-red">{reject}</button><button type="button" onClick={onApprove} className="flex-1 cursor-pointer rounded-full border-0 bg-gf-pink-500 px-3 py-2.5 font-semibold">{approve}</button></div> }
function RevealButton({ revealed, loading, labels, onClick }: { revealed: boolean; loading: boolean; labels: { hideAccount: string; revealAccount: string }; onClick: () => void }) { return <button type="button" disabled={loading} onClick={onClick} className="mt-4 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm font-semibold text-gf-brown-700">{revealed ? <EyeOff size={16} /> : <Eye size={16} />}{revealed ? labels.hideAccount : labels.revealAccount}</button> }
function RejectDialog({ open, onOpenChange, title, labels, reason, setReason, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; labels: { reject: string; reason: string; reasonPlaceholder: string }; reason: string; setReason: (value: string) => void; onSubmit: () => void }) { return <FormDialog open={open} onOpenChange={onOpenChange} title={title} submitLabel={labels.reject} onSubmit={onSubmit}><div><Label className="mb-2">{labels.reason}</Label><Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={labels.reasonPlaceholder} /></div></FormDialog> }
