'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MoreHorizontal, Plus, Trash2 } from 'lucide-react'
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
  accounts: z.array(z.object({
    id: z.number().optional(),
    bankId: z.number().min(1),
    bankCode: z.string().optional(),
    bankName: z.string().optional(),
    bankAbbreviation: z.string().optional(),
    accountName: z.string().min(1),
    accountNumber: z.string().min(1),
    active: z.boolean(),
    sortOrder: z.number().optional(),
  })).min(1),
  paymentReviewHours: z.number().min(1),
  payoutReviewDays: z.number().min(0),
  supportedBanks: z.string().min(1),
})

const addAdminSchema = z.object({
  email: z.string().email(),
})

type FeesForm = z.infer<typeof feesSchema>
type BookingForm = z.infer<typeof bookingSchema>
type PaymentForm = z.infer<typeof paymentSchema>
type AddAdminForm = z.infer<typeof addAdminSchema>

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
  const paymentAccounts = useFieldArray({
    control: paymentForm.control,
    name: 'accounts',
    keyName: 'fieldKey',
  })
  const addAdminForm = useForm<AddAdminForm>({ resolver: zodResolver(addAdminSchema) })

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
          {t.adminRoleValue}
        </span>
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
            <div className="mb-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-gf-brown-900">{t.receivingAccounts}</div>
                  <div className="mt-1 text-[12.5px] text-gf-muted">{t.receivingAccountsHint}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => paymentAccounts.append({
                    bankId: banks[0]?.id ?? 0,
                    bankCode: banks[0]?.code,
                    bankName: banks[0]?.name,
                    bankAbbreviation: banks[0]?.abbreviation,
                    accountName: '',
                    accountNumber: '',
                    active: true,
                    sortOrder: paymentAccounts.fields.length,
                  })}
                >
                  <Plus size={16} />
                  {t.addPaymentAccount}
                </Button>
              </div>

              <div className="divide-y divide-gf-line border-y border-gf-line">
                {paymentAccounts.fields.map((field, index) => {
                  const selectedBankId = paymentForm.watch(`accounts.${index}.bankId`)
                  const selectedBank = banks.find((bank) => bank.id === selectedBankId)
                  const isPromptPay = selectedBank?.code === 'PROMPTPAY'

                  return (
                    <div key={field.fieldKey} className="py-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-gf-brown-900">
                          {t.paymentAccount} {index + 1}
                        </div>
                        <button
                          type="button"
                          title={t.removePaymentAccount}
                          aria-label={t.removePaymentAccount}
                          disabled={paymentAccounts.fields.length === 1}
                          onClick={() => paymentAccounts.remove(index)}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-gf-red hover:bg-gf-pink-100 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className={FORM_GRID_CLASS}>
                        <Field label={t.platformBankName}>
                          <Select
                            value={selectedBankId ? String(selectedBankId) : ''}
                            onValueChange={(value) => {
                              const bank = banks.find((item) => item.id === Number(value))
                              paymentForm.setValue(`accounts.${index}.bankId`, Number(value), { shouldDirty: true })
                              paymentForm.setValue(`accounts.${index}.bankCode`, bank?.code, { shouldDirty: true })
                              paymentForm.setValue(`accounts.${index}.bankName`, bank?.name, { shouldDirty: true })
                              paymentForm.setValue(`accounts.${index}.bankAbbreviation`, bank?.abbreviation, { shouldDirty: true })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={t.platformBankName} />
                            </SelectTrigger>
                            <SelectContent>
                              {banks.map((bank) => (
                                <SelectItem key={bank.id} value={String(bank.id)}>
                                  {bank.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label={t.platformAccountName}>
                          <Input {...paymentForm.register(`accounts.${index}.accountName`)} />
                        </Field>
                        <Field label={isPromptPay ? t.promptPayNumber : t.platformAccountNo}>
                          <Input {...paymentForm.register(`accounts.${index}.accountNumber`)} />
                        </Field>
                      </div>

                      {isPromptPay && (
                        <div className="-mt-3 mb-4 text-[12px] text-gf-muted">{t.promptPayHint}</div>
                      )}
                      <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-gf-brown-800">
                        <input
                          type="checkbox"
                          {...paymentForm.register(`accounts.${index}.active`)}
                        />
                        {t.activePaymentAccount}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className={FORM_GRID_CLASS}>
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
          <Field label={t.email}>
            <Input type="email" {...addAdminForm.register('email')} />
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
