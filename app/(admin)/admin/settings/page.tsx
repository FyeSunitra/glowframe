'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MoreHorizontal } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/admin/shared/Field'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { useAppStore } from '@/store/appStore'
import { getPageText } from '@/lib/menuI18n'
import { unwrapApiResponse } from '@/lib/api'
import { adminSettingsService } from '@/services/adminSettings'
import { masterDataService } from '@/services/masterData'
import type { AdminAccount, AdminSettings, AdminSettingsPatchPayload } from '@/types/adminSettings'
import type { Bank } from '@/types/masterData'

const CARD_CLASS = 'mb-5 rounded-[22px] bg-white px-7 py-8 shadow-[var(--gf-shadow)]'
const SECTION_TITLE_CLASS = 'mb-6 border-b border-[var(--gf-brown-100)] pb-3 font-[var(--font-poppins)] text-[17px] font-bold text-gf-brown-900'
const FORM_GRID_CLASS = 'mb-6 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-x-6 gap-y-5'
const SELECT_TRIGGER_CLASS = 'h-[42px] w-full rounded-[14px] border-[1.5px] border-gf-brown-300 bg-white px-3.5 text-sm text-gf-brown-900'

const feesSchema = z.object({
  platformFee: z.number().min(0).max(100),
  minPayout: z.number().min(0),
  lateFeePerDay: z.number().min(0),
})

const bookingSchema = z.object({
  minAdvanceDays: z.number().min(0),
  paymentDeadlineHours: z.number().min(1),
  ownerPrepDays: z.number().min(0),
  cancellationWindowHours: z.number().min(0),
})

const paymentSchema = z.object({
  platformBankName: z.string().min(1),
  platformAccountName: z.string().min(1),
  platformAccountNo: z.string().min(1),
  paymentReviewHours: z.number().min(1),
  payoutReviewDays: z.number().min(0),
  supportedBanks: z.string().min(1),
})

const addAdminSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1)
})

type FeesForm = z.infer<typeof feesSchema>
type BookingForm = z.infer<typeof bookingSchema>
type PaymentForm = z.infer<typeof paymentSchema>
type AddAdminForm = z.infer<typeof addAdminSchema>

const ROLE_OPTIONS = ['super-admin', 'moderator', 'finance']

export default function SettingsPage() {
  const locale = useAppStore((s) => s.locale)
  const t = getPageText(locale, 'adminSettings')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [addAdminOpen, setAddAdminOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AdminAccount | null>(null)

  const { data: settings } = useQuery<AdminSettings>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => unwrapApiResponse(await adminSettingsService.getSettings()),
  })

  const { data: banks = [] } = useQuery<Bank[]>({
    queryKey: ['admin', 'master', 'banks', { isActive: true }],
    queryFn: async () => unwrapApiResponse(await masterDataService.banks.list({ is_active: true, limit: 100 })).items,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })

  const saveMutation = useMutation({
    mutationFn: (payload: AdminSettingsPatchPayload) =>
      adminSettingsService.updateSettings(payload).then(unwrapApiResponse),
    onSuccess: () => {
      invalidate()
      showToast(t.saved)
    },
  })

  const feesForm = useForm<FeesForm>({ resolver: zodResolver(feesSchema), values: settings?.fees })
  const bookingForm = useForm<BookingForm>({ resolver: zodResolver(bookingSchema), values: settings?.booking })
  const paymentForm = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema), values: settings?.payment })
  const addAdminForm = useForm<AddAdminForm>({ resolver: zodResolver(addAdminSchema) })
  const selectedRole = useWatch({ control: addAdminForm.control, name: 'role' })
  const selectedPlatformBank = useWatch({ control: paymentForm.control, name: 'platformBankName' })
  const platformBankOptions = useMemo(() => {
    const hasCurrent = selectedPlatformBank && banks.some((bank) => bank.name === selectedPlatformBank)

    return hasCurrent || !selectedPlatformBank
      ? banks
      : [
          {
            id: 0,
            code: selectedPlatformBank,
            abbreviation: selectedPlatformBank,
            name: selectedPlatformBank,
            logoUrl: null,
            usedInAccounts: 0,
            active: true,
          },
          ...banks,
        ]
  }, [banks, selectedPlatformBank])

  const adminCols = useMemo(() => [
    {
      key: 'name',
      header: t.name,
      render: (row: AdminAccount) => (
        <span className="font-semibold text-gf-brown-900">{row.name}</span>
      )
    },
    {
      key: 'email',
      header: t.email,
      render: (row: AdminAccount) => (
        <span className="text-[13px] text-[var(--gf-brown-600)]">{row.email}</span>
      )
    },
    {
      key: 'role',
      header: t.role,
      render: (row: AdminAccount) => (
        <span className="text-[12px] font-semibold [padding:5px_12px] rounded-full bg-gf-pink-100 text-[var(--gf-pink-700)] [text-transform:capitalize] inline-block">
          {row.role}
        </span>
      )
    },
    {
      key: 'lastLogin',
      header: t.lastLogin,
      render: (row: AdminAccount) => (
        <span className="text-[13px] text-gf-muted">{row.lastLogin}</span>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (row: AdminAccount) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:6px_8px] rounded-[8px] text-gf-brown-700">
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => { setRemoveTarget(row); setRemoveOpen(true) }}
            >
              {t.remove}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  ], [t])

  const removeTitle = `${t.removeTitlePrefix} ${removeTarget?.name ?? t.removeTitleFallback}${t.removeTitleSuffix}`

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', t.title]} title={t.title} />

      <div className="max-w-[1100px]">
        <div className={CARD_CLASS}>
          <div className={SECTION_TITLE_CLASS}>{t.platformFees}</div>
          <form onSubmit={feesForm.handleSubmit((data) => saveMutation.mutate({ section: 'fees', data }))}>
            <div className={FORM_GRID_CLASS}>
              <Field label={t.platformFee}>
                <Input type="number" step="0.01" {...feesForm.register('platformFee', { valueAsNumber: true })} />
              </Field>
              <Field label={t.minPayout}>
                <Input type="number" {...feesForm.register('minPayout', { valueAsNumber: true })} />
              </Field>
              <Field label={t.lateFeePerDay}>
                <Input type="number" {...feesForm.register('lateFeePerDay', { valueAsNumber: true })} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="px-7">{t.save}</Button>
            </div>
          </form>
        </div>

        <div className={CARD_CLASS}>
          <div className={SECTION_TITLE_CLASS}>{t.bookingPolicy}</div>
          <form onSubmit={bookingForm.handleSubmit((data) => saveMutation.mutate({ section: 'booking', data }))}>
            <div className={FORM_GRID_CLASS}>
              <Field label={t.minAdvanceDays}>
                <Input type="number" {...bookingForm.register('minAdvanceDays', { valueAsNumber: true })} />
              </Field>
              <Field label={t.paymentDeadlineHours}>
                <Input type="number" {...bookingForm.register('paymentDeadlineHours', { valueAsNumber: true })} />
              </Field>
              <Field label={t.ownerPrepDays}>
                <Input type="number" {...bookingForm.register('ownerPrepDays', { valueAsNumber: true })} />
              </Field>
              <Field label={t.cancellationWindowHours}>
                <Input type="number" {...bookingForm.register('cancellationWindowHours', { valueAsNumber: true })} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="px-7">{t.save}</Button>
            </div>
          </form>
        </div>

        <div className={CARD_CLASS}>
          <div className={SECTION_TITLE_CLASS}>{t.paymentPayout}</div>
          <form onSubmit={paymentForm.handleSubmit((data) => saveMutation.mutate({ section: 'payment', data }))}>
            <div className={FORM_GRID_CLASS}>
              <Field label={t.platformBankName}>
                <Select
                  value={selectedPlatformBank ?? ''}
                  onValueChange={(value) => paymentForm.setValue('platformBankName', value ?? '', { shouldDirty: true })}
                >
                  <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                    <SelectValue placeholder={t.platformBankName} />
                  </SelectTrigger>
                  <SelectContent>
                    {platformBankOptions.map((bank) => (
                      <SelectItem key={`${bank.id}-${bank.code}`} value={bank.name}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.platformAccountName}>
                <Input {...paymentForm.register('platformAccountName')} />
              </Field>
              <Field label={t.platformAccountNo}>
                <Input {...paymentForm.register('platformAccountNo')} />
              </Field>
              <Field label={t.paymentReviewHours}>
                <Input type="number" {...paymentForm.register('paymentReviewHours', { valueAsNumber: true })} />
              </Field>
              <Field label={t.payoutReviewDays}>
                <Input type="number" {...paymentForm.register('payoutReviewDays', { valueAsNumber: true })} />
              </Field>
              <Field label={t.supportedBanks}>
                <Input {...paymentForm.register('supportedBanks')} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="px-7">{t.save}</Button>
            </div>
          </form>
        </div>

        <div className={CARD_CLASS}>
          <div className="flex items-center justify-between [margin-bottom:24px] [padding-bottom:12px] [border-bottom:1px_solid_var(--gf-brown-100)]">
            <div className="text-[17px] font-bold text-gf-brown-900 font-[var(--font-poppins)]">
              {t.adminAccounts}
            </div>
            <Button
              variant="outline"
              onClick={() => { addAdminForm.reset(); setAddAdminOpen(true) }}
            >
              {t.addAdmin}
            </Button>
          </div>
          <DataTable columns={adminCols} data={settings?.admins ?? []} />
        </div>
      </div>

      <FormDialog
        open={addAdminOpen}
        onOpenChange={setAddAdminOpen}
        title={t.addAdminTitle}
        submitLabel={t.add}
        onSubmit={addAdminForm.handleSubmit((data) => {
          saveMutation.mutate({ section: 'addAdmin', data })
          setAddAdminOpen(false)
        })}
      >
        <div className="flex flex-col gap-[18px]">
          <Field label={t.name}>
            <Input {...addAdminForm.register('name')} />
          </Field>
          <Field label={t.email}>
            <Input type="email" {...addAdminForm.register('email')} />
          </Field>
          <Field label={t.role}>
            <Select value={selectedRole ?? ''} onValueChange={(v) => addAdminForm.setValue('role', v ?? '')}>
              <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                <SelectValue placeholder={t.selectRole} />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(r => (
                  <SelectItem key={r} value={r} className="[text-transform:capitalize]">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FormDialog>

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={removeTitle}
        description={t.removeDescription}
        destructive
        onConfirm={() => {
          if (removeTarget) saveMutation.mutate({ section: 'removeAdmin', id: removeTarget.id })
          setRemoveOpen(false)
        }}
      />
    </div>
  )
}
