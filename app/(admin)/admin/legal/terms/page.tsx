'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileText, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DataTable } from '@/components/admin/shared/DataTable'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { unwrapApiResponse } from '@/lib/api'
import { getPageText } from '@/lib/menuI18n'
import { cn } from '@/lib/utils'
import { adminPolicyService } from '@/services/policy'
import { useAppStore } from '@/store/appStore'
import type {
  CreatePolicyVersionPayload,
  PolicyAction,
  PolicyDocumentType,
  PolicyVersion,
} from '@/types/policy'

const POLICY_TYPES: PolicyDocumentType[] = [
  'termsOfService',
  'privacyPolicy',
  'rentalAgreement',
  'listingPolicy',
  'paymentPolicy',
  'identityVerificationConsent',
]

const versionSchema = z.object({
  version: z.string().trim().min(1),
  effectiveDate: z.string().optional(),
  titleTh: z.string().trim().min(1),
  titleEn: z.string().trim().min(1),
  bodyTh: z.string().trim().min(1),
  bodyEn: z.string().trim().min(1),
  isRequired: z.boolean(),
  requireReconsent: z.boolean(),
})

type VersionForm = z.infer<typeof versionSchema>
type ContentLocale = 'th' | 'en'

export default function TermsPage() {
  const locale = useAppStore((state) => state.locale)
  const t = getPageText(locale, 'adminLegalTerms')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [activeType, setActiveType] = useState<PolicyDocumentType>('termsOfService')
  const [formLocale, setFormLocale] = useState<ContentLocale>('th')
  const [viewLocale, setViewLocale] = useState<ContentLocale>(locale)
  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [actionTarget, setActionTarget] = useState<{
    id: number
    action: PolicyAction
  } | null>(null)
  const [viewTarget, setViewTarget] = useState<PolicyVersion | null>(null)

  const { data: versions = [], isLoading } = useQuery<PolicyVersion[]>({
    queryKey: ['admin', 'legal', 'terms', activeType],
    queryFn: () =>
      adminPolicyService.list(activeType).then(unwrapApiResponse),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'legal', 'terms'] })

  const createMutation = useMutation({
    mutationFn: (data: CreatePolicyVersionPayload) =>
      adminPolicyService.create(data).then(unwrapApiResponse),
    onSuccess: () => {
      invalidate()
      showToast(t.created)
    },
    onError: () => showToast(t.saveFailed),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: PolicyAction }) =>
      adminPolicyService.applyAction(id, action).then(unwrapApiResponse),
    onSuccess: (_, variables) => {
      invalidate()
      const messages: Record<PolicyAction, string> = {
        publish: t.published,
        'force-reconsent': t.reconsentEnabled,
        archive: t.archived,
      }
      showToast(messages[variables.action])
    },
    onError: () => showToast(t.saveFailed),
  })

  const form = useForm<VersionForm>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      version: '',
      effectiveDate: '',
      titleTh: '',
      titleEn: '',
      bodyTh: '',
      bodyEn: '',
      isRequired: true,
      requireReconsent: false,
    },
  })

  const columns = useMemo(
    () => [
      {
        key: 'version',
        header: t.version,
        render: (row: PolicyVersion) => (
          <span className="font-bold">{row.version}</span>
        ),
      },
      {
        key: 'title',
        header: t.titleLabel,
        render: (row: PolicyVersion) => (
          <div>
            <div className="font-semibold text-gf-brown-900">
              {locale === 'th' ? row.titleTh : row.titleEn}
            </div>
            <div className="mt-0.5 text-xs text-gf-muted">
              {t.bilingualDocument}
            </div>
          </div>
        ),
      },
      {
        key: 'effectiveDate',
        header: t.effectiveDate,
        render: (row: PolicyVersion) =>
          formatDate(row.effectiveDate, locale, t.notSet),
      },
      {
        key: 'accepted',
        header: t.usersAccepted,
        render: (row: PolicyVersion) =>
          `${row.usersAccepted.toLocaleString()} / ${row.totalUsers.toLocaleString()}`,
      },
      // {
      //   key: 'rate',
      //   header: t.acceptanceRate,
      //   render: (row: PolicyVersion) => {
      //     const percentage =
      //       row.totalUsers > 0
      //         ? Math.round((row.usersAccepted / row.totalUsers) * 100)
      //         : 0

      //     return (
      //       <div className="min-w-[120px]">
      //         <span className="font-semibold">{percentage}%</span>
      //         <div className="mt-1.5 h-1.5 w-full rounded-full bg-gf-line">
      //           <div
      //             className="h-1.5 rounded-full bg-gf-brown-800"
      //             style={{ width: `${percentage}%` }}
      //           />
      //         </div>
      //       </div>
      //     )
      //   },
      // },
      {
        key: 'required',
        header: t.required,
        render: (row: PolicyVersion) => (
          <StatusBadge status={row.isRequired ? 'active' : 'default'} />
        ),
      },
      {
        key: 'status',
        header: t.status,
        render: (row: PolicyVersion) => <StatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        header: '',
        render: (row: PolicyVersion) => (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="cursor-pointer rounded-[8px] border-0 bg-transparent px-2 py-1 text-gf-brown-700"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem
                onClick={() => {
                  setViewTarget(row)
                  setViewLocale(locale)
                  setViewOpen(true)
                }}
              >
                {t.viewFullText}
              </DropdownMenuItem>
              {row.status === 'draft' && (
                <DropdownMenuItem
                  onClick={() =>
                    setActionTarget({ id: row.id, action: 'publish' })
                  }
                >
                  {t.publish}
                </DropdownMenuItem>
              )}
              {!row.forceReconsent && row.status === 'current' && (
                <DropdownMenuItem
                  onClick={() =>
                    setActionTarget({
                      id: row.id,
                      action: 'force-reconsent',
                    })
                  }
                >
                  {t.enableForceReconsent}
                </DropdownMenuItem>
              )}
              {row.status !== 'archived' && (
                <DropdownMenuItem
                  onClick={() =>
                    setActionTarget({ id: row.id, action: 'archive' })
                  }
                >
                  {t.archive}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => showToast(t.downloading)}>
                {t.downloadAcceptanceList}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [locale, showToast, t],
  )

  function openCreateDialog() {
    form.reset({
      version: '',
      effectiveDate: '',
      titleTh: t.typeLabelsTh[activeType],
      titleEn: t.typeLabels[activeType],
      bodyTh: '',
      bodyEn: '',
      isRequired: true,
      requireReconsent: false,
    })
    setFormLocale(locale)
    setFormOpen(true)
  }

  const actionDialog = getActionDialog(actionTarget?.action, t)

  return (
    <div className="animate-fade-up">
      <AdminPageHeader
        breadcrumb={['Admin', 'Legal', t.breadcrumbTitle]}
        title={t.title}
        action={
          <button
            onClick={openCreateDialog}
            className="cursor-pointer rounded-full border-[1.5px] border-gf-brown-300 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-gf-brown-800"
          >
            {t.newVersion}
          </button>
        }
      />

      <Tabs
        value={activeType}
        onValueChange={(value) => setActiveType(value as PolicyDocumentType)}
        className="mb-5"
      >
        <div className="overflow-x-auto border-b border-gf-line">
          <TabsList
            variant="line"
            className="h-auto min-w-max gap-1 p-0"
          >
            {POLICY_TYPES.map((type) => (
              <TabsTrigger
                key={type}
                value={type}
                className="h-11 flex-none px-4 text-[13px] font-semibold"
              >
                {t.typeLabels[type]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <DataTable
        columns={columns}
        data={versions}
        loading={isLoading}
        empty={
          <EmptyState
            icon={FileText}
            heading={t.noVersions}
            sub={t.noVersionsSub}
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={`${t.createTitle}: ${t.typeLabels[activeType]}`}
        submitLabel={t.createDraft}
        contentClassName="max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] overflow-y-auto sm:max-w-[860px] lg:max-w-[960px]"
        onSubmit={form.handleSubmit((data) => {
          createMutation.mutate({ ...data, docType: activeType })
          setFormOpen(false)
        })}
      >
        <form className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.version}>
              <Input {...form.register('version')} placeholder="v1.1" />
            </Field>
            <Field label={t.effectiveDate}>
              <Input type="date" {...form.register('effectiveDate')} />
            </Field>
          </div>

          <LanguageTabs value={formLocale} onChange={setFormLocale} t={t} />

          <div className={cn(formLocale !== 'th' && 'hidden')}>
            <div className="flex flex-col gap-4">
              <Field label={t.titleThai}>
                <Input {...form.register('titleTh')} />
              </Field>
              <Field label={t.bodyThai}>
                <Textarea
                  {...form.register('bodyTh')}
                  rows={10}
                  className="rounded-[14px] border-[1.5px] border-gf-brown-300 bg-white p-3.5"
                />
              </Field>
            </div>
          </div>

          <div className={cn(formLocale !== 'en' && 'hidden')}>
            <div className="flex flex-col gap-4">
              <Field label={t.titleEnglish}>
                <Input {...form.register('titleEn')} />
              </Field>
              <Field label={t.bodyEnglish}>
                <Textarea
                  {...form.register('bodyEn')}
                  rows={10}
                  className="rounded-[14px] border-[1.5px] border-gf-brown-300 bg-white p-3.5"
                />
              </Field>
            </div>
          </div>

          {Object.keys(form.formState.errors).length > 0 && (
            <p className="text-xs font-medium text-gf-red">
              {t.completeBothLanguages}
            </p>
          )}

          <label className="flex items-center gap-2.5 text-[13px] font-semibold text-gf-brown-800">
            <input type="checkbox" {...form.register('isRequired')} />
            {t.isRequired}
          </label>
          <label className="flex items-center gap-2.5 text-[13px] font-semibold text-gf-brown-800">
            <input type="checkbox" {...form.register('requireReconsent')} />
            {t.requireReconsent}
          </label>
        </form>
      </FormDialog>

      <FormDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        title={
          viewTarget
            ? `${viewTarget.version} - ${t.typeLabels[viewTarget.docType]}`
            : t.viewFullText
        }
        submitLabel={t.close}
        onSubmit={() => setViewOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <LanguageTabs value={viewLocale} onChange={setViewLocale} t={t} />
          <div>
            <h3 className="mb-2 text-base font-semibold text-gf-brown-900">
              {viewTarget
                ? viewLocale === 'th'
                  ? viewTarget.titleTh
                  : viewTarget.titleEn
                : ''}
            </h3>
            <p className="mb-4 text-xs text-gf-muted">
              {t.version} {viewTarget?.version} | {t.effectiveDate}:{' '}
              {formatDate(viewTarget?.effectiveDate ?? null, locale, t.notSet)}
            </p>
            <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-[8px] border border-gf-line bg-white p-4 text-sm leading-7 text-gf-brown-800">
              {viewTarget
                ? viewLocale === 'th'
                  ? viewTarget.bodyTh
                  : viewTarget.bodyEn
                : ''}
            </div>
          </div>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setActionTarget(null)
        }}
        title={actionDialog.title}
        description={actionDialog.description}
        destructive={actionTarget?.action === 'archive'}
        onConfirm={() => {
          if (actionTarget) actionMutation.mutate(actionTarget)
          setActionTarget(null)
        }}
      />
    </div>
  )
}

function LanguageTabs({
  value,
  onChange,
  t,
}: {
  value: ContentLocale
  onChange: (locale: ContentLocale) => void
  t: ReturnType<typeof getPageText<'adminLegalTerms'>>
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(nextValue) => onChange(nextValue as ContentLocale)}
    >
      <TabsList className="h-10 w-full rounded-[8px] bg-gf-pink-100 p-1">
        <TabsTrigger value="th" className="rounded-[6px]">
          {t.thaiLanguage}
        </TabsTrigger>
        <TabsTrigger value="en" className="rounded-[6px]">
          {t.englishLanguage}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-bold leading-5 text-gf-brown-700">
        {label}
      </Label>
      {children}
    </div>
  )
}

function getActionDialog(
  action: PolicyAction | undefined,
  t: ReturnType<typeof getPageText<'adminLegalTerms'>>,
) {
  if (action === 'force-reconsent') {
    return { title: t.reconsentTitle, description: t.reconsentDescription }
  }
  if (action === 'archive') {
    return { title: t.archiveTitle, description: t.archiveDescription }
  }
  return { title: t.publishTitle, description: t.publishDescription }
}

function formatDate(
  value: string | null,
  locale: 'th' | 'en',
  fallback: string,
) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
