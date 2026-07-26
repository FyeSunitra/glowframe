'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { FileText, MoreHorizontal } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { getPageText } from '@/lib/menuI18n'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

type PolicyType = 'termsOfService' | 'privacyPolicy' | 'rentalAgreement' | 'listingPolicy' | 'paymentPolicy' | 'identityVerificationConsent'

interface PolicyVersion {
  id: number
  version: string
  docType: PolicyType
  title: string
  effectiveDate: string | null
  publishedAt: string | null
  summary: string
  body: string
  usersAccepted: number
  totalUsers: number
  forceReconsent: boolean
  isRequired: boolean
  status: string
}

const POLICY_TYPES: PolicyType[] = [
  'termsOfService',
  'privacyPolicy',
  'rentalAgreement',
  'listingPolicy',
  'paymentPolicy',
  'identityVerificationConsent',
]

const versionSchema = z.object({
  version: z.string().min(1),
  title: z.string().min(1),
  docType: z.enum(POLICY_TYPES),
  effectiveDate: z.string().optional(),
  summary: z.string().min(1),
  body: z.string().min(1),
  isRequired: z.boolean(),
  requireReconsent: z.boolean(),
})

type VersionForm = z.infer<typeof versionSchema>

const CARD_CLASS = 'rounded-[22px] bg-white p-[22px] shadow-[var(--gf-shadow)]'
export default function TermsPage() {
  const locale = useAppStore((s) => s.locale)
  const t = getPageText(locale, 'adminLegalTerms')
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [activeType, setActiveType] = useState<PolicyType>('termsOfService')
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [publishId, setPublishId] = useState<number | null>(null)
  const [reconsentId, setReconsentId] = useState<number | null>(null)
  const [archiveId, setArchiveId] = useState<number | null>(null)
  const [viewTarget, setViewTarget] = useState<PolicyVersion | null>(null)

  const { data: versions = [], isLoading } = useQuery<PolicyVersion[]>({
    queryKey: ['admin', 'legal', 'terms', activeType],
    queryFn: () => axios.get('/api/admin/legal/terms', { params: { type: activeType } }).then(r => r.data.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'legal', 'terms'] })

  const createMutation = useMutation({
    mutationFn: (data: VersionForm) => axios.post('/api/admin/legal/terms', data),
    onSuccess: () => { invalidate(); showToast(t.created) },
  })

  const publishMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/legal/terms/${id}`, { action: 'publish' }),
    onSuccess: () => { invalidate(); showToast(t.published) },
  })

  const reconsentMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/legal/terms/${id}`, { action: 'force-reconsent' }),
    onSuccess: () => { invalidate(); showToast(t.reconsentEnabled) },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: number) => axios.patch(`/api/admin/legal/terms/${id}`, { action: 'archive' }),
    onSuccess: () => { invalidate(); showToast(t.archived) },
  })

  const form = useForm<VersionForm>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      docType: activeType,
      isRequired: true,
      requireReconsent: false,
    },
  })
  const selectedDocType = useWatch({ control: form.control, name: 'docType' })

  const columns = useMemo(() => [
    { key: 'version', header: t.version, render: (r: PolicyVersion) => <span className="font-[var(--font-poppins)] font-bold">{r.version}</span> },
    {
      key: 'title', header: t.titleLabel, render: (r: PolicyVersion) => (
        <div>
          <div className="[font-weight:650] text-gf-brown-900">{r.title}</div>
          <div className="text-[12px] text-gf-muted [margin-top:2px]">{t.typeLabels[r.docType]}</div>
        </div>
      )
    },
    { key: 'effectiveDate', header: t.effectiveDate, render: (r: PolicyVersion) => formatDate(r.effectiveDate, locale, t.notSet) },
    { key: 'summary', header: t.summary, render: (r: PolicyVersion) => <span className="text-[12.5px] text-gf-muted">{truncate(r.summary, 68)}</span> },
    { key: 'accepted', header: t.usersAccepted, render: (r: PolicyVersion) => `${r.usersAccepted.toLocaleString()} / ${r.totalUsers.toLocaleString()}` },
    {
      key: 'rate', header: t.acceptanceRate, render: (r: PolicyVersion) => {
        const pct = r.totalUsers > 0 ? Math.round((r.usersAccepted / r.totalUsers) * 100) : 0
        return (
          <div className="min-w-[120px]">
            <span className="[font-weight:650]">{pct}%</span>
            <div className="bg-gf-line rounded-full h-[6px] [margin-top:5px] w-full">
              <div className="h-1.5 rounded-full bg-gf-brown-800" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      }
    },
    { key: 'required', header: t.required, render: (r: PolicyVersion) => <StatusBadge status={r.isRequired ? 'active' : 'default'} /> },
    { key: 'forceReconsent', header: t.forceReconsent, render: (r: PolicyVersion) => <StatusBadge status={r.forceReconsent ? 'pending' : 'default'} /> },
    { key: 'status', header: t.status, render: (r: PolicyVersion) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', header: '', render: (r: PolicyVersion) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}>
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => { setViewTarget(r); setViewOpen(true) }}>{t.viewFullText}</DropdownMenuItem>
            {r.status === 'draft' && <DropdownMenuItem onClick={() => setPublishId(r.id)}>{t.publish}</DropdownMenuItem>}
            {!r.forceReconsent && r.status === 'current' && <DropdownMenuItem onClick={() => setReconsentId(r.id)}>{t.enableForceReconsent}</DropdownMenuItem>}
            {r.status !== 'archived' && <DropdownMenuItem onClick={() => setArchiveId(r.id)}>{t.archive}</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => showToast(t.downloading)}>{t.downloadAcceptanceList}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ], [locale, showToast, t])

  function openCreateDialog() {
    form.reset({
      docType: activeType,
      title: t.typeLabels[activeType],
      version: '',
      effectiveDate: '',
      summary: '',
      body: '',
      isRequired: true,
      requireReconsent: false,
    })
    setFormOpen(true)
  }

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Legal', t.breadcrumbTitle]}
        title={t.title}
        action={<button onClick={openCreateDialog} className="[border:1.5px_solid_var(--gf-brown-300)] bg-transparent text-gf-brown-800 rounded-full [padding:9px_16px] text-[13px] font-semibold cursor-pointer">{t.newVersion}</button>}
      />

      <div className={cn(CARD_CLASS, 'mb-[22px]')}>
        <div className="flex flex-wrap gap-[8px]">
          {POLICY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                'cursor-pointer rounded-full border-[1.5px] px-4 py-2.5 text-[13px] font-bold',
                activeType === type
                  ? 'border-gf-pink-500 bg-gf-pink-100 text-gf-brown-900'
                  : 'border-gf-brown-300 bg-white text-gf-brown-700',
              )}
            >
              {t.typeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={versions}
        loading={isLoading}
        empty={<EmptyState icon={FileText} heading={t.noVersions} sub={t.noVersionsSub} />}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={t.createTitle}
        submitLabel={t.createDraft}
        onSubmit={form.handleSubmit(data => { createMutation.mutate(data); setFormOpen(false) })}
      >
        <form className="flex flex-col gap-[14px]">
          <div className="grid [grid-template-columns:repeat(auto-fit,_minmax(220px,_1fr))] gap-[12px]">
            <Field label={t.documentType}>
              <Select value={selectedDocType} onValueChange={v => form.setValue('docType', (v ?? 'termsOfService') as PolicyType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POLICY_TYPES.map(type => <SelectItem key={type} value={type}>{t.typeLabels[type]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label={t.version}><Input {...form.register('version')} placeholder="v1.1" /></Field>
            <Field label={t.effectiveDate}><Input type="date" {...form.register('effectiveDate')} /></Field>
          </div>
          <Field label={t.titleLabel}><Input {...form.register('title')} /></Field>
          <Field label={t.summary}><Textarea {...form.register('summary')} rows={3} className="rounded-[14px] bg-white [border:1.5px_solid_var(--gf-brown-300)] [padding:14px]" /></Field>
          <Field label={t.body}><Textarea {...form.register('body')} rows={10} className="rounded-[14px] bg-white [border:1.5px_solid_var(--gf-brown-300)] [padding:14px]" /></Field>
          <label className="flex items-center gap-[9px] text-[13px] text-gf-brown-800 font-semibold">
            <input type="checkbox" {...form.register('isRequired')} />
            {t.isRequired}
          </label>
          <label className="flex items-center gap-[9px] text-[13px] text-gf-brown-800 font-semibold">
            <input type="checkbox" {...form.register('requireReconsent')} />
            {t.requireReconsent}
          </label>
        </form>
      </FormDialog>

      <FormDialog open={viewOpen} onOpenChange={setViewOpen} title={viewTarget ? `${viewTarget.version} - ${t.typeLabels[viewTarget.docType]}` : t.viewFullText} submitLabel={t.close} onSubmit={() => setViewOpen(false)}>
        <Textarea
          readOnly
          rows={16}
          value={viewTarget ? `${viewTarget.title}\nVersion: ${viewTarget.version}\nEffective: ${formatDate(viewTarget.effectiveDate, locale, t.notSet)}\nStatus: ${viewTarget.status}\n\n${viewTarget.summary}\n\n${viewTarget.body}` : ''}
        />
      </FormDialog>

      <ConfirmDialog open={publishId !== null} onOpenChange={open => { if (!open) setPublishId(null) }} title={t.publishTitle} description={t.publishDescription} onConfirm={() => { if (publishId !== null) publishMutation.mutate(publishId); setPublishId(null) }} />
      <ConfirmDialog open={reconsentId !== null} onOpenChange={open => { if (!open) setReconsentId(null) }} title={t.reconsentTitle} description={t.reconsentDescription} onConfirm={() => { if (reconsentId !== null) reconsentMutation.mutate(reconsentId); setReconsentId(null) }} />
      <ConfirmDialog open={archiveId !== null} onOpenChange={open => { if (!open) setArchiveId(null) }} title={t.archiveTitle} description={t.archiveDescription} destructive onConfirm={() => { if (archiveId !== null) archiveMutation.mutate(archiveId); setArchiveId(null) }} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <Label className="text-[12px] font-bold text-gf-brown-700 [line-height:1.25]">{label}</Label>
      {children}
    </div>
  )
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}...` : value
}

function formatDate(value: string | null, locale: 'th' | 'en', fallback: string) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
