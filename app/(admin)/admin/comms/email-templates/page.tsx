'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MoreHorizontal } from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { useMenuI18n } from '@/hooks/useMenuI18n'
import { unwrapApiResponse } from '@/lib/api'
import {
  createGlowframeEmailHtml,
  EMAIL_TEMPLATE_SAMPLE_VARIABLES,
  renderEmailHtmlTemplate,
} from '@/lib/email/emailTemplateUtils'
import { cn } from '@/lib/utils'
import { adminEmailTemplatesService } from '@/services/adminEmailTemplates'
import type { EmailTemplate, EmailTemplateRecipientRole, SendEmailTemplateTestPayload, UpdateEmailTemplatePayload } from '@/types/emailTemplate'

type EditForm = UpdateEmailTemplatePayload

export default function EmailTemplatesPage() {
  const { locale } = useMenuI18n()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [previewing, setPreviewing] = useState<EmailTemplate | null>(null)
  const [testing, setTesting] = useState<EmailTemplate | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [testEmail, setTestEmail] = useState('')

  const templatesQuery = useQuery({
    queryKey: ['admin', 'comms', 'email-templates'],
    queryFn: async () => unwrapApiResponse(await adminEmailTemplatesService.list()),
  })

  const saveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: EditForm }) =>
      unwrapApiResponse(await adminEmailTemplatesService.update(id, payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'comms', 'email-templates'] })
      setEditing(null)
      setForm(null)
      showToast(locale === 'th' ? 'บันทึกเทมเพลตอีเมลแล้ว' : 'Email template saved.')
    },
    onError: (error) => showToast(error instanceof Error ? error.message : 'Unable to save the template.'),
  })

  const testMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: SendEmailTemplateTestPayload }) =>
      unwrapApiResponse(await adminEmailTemplatesService.sendTest(id, payload)),
    onSuccess: () => {
      setTesting(null)
      setTestEmail('')
      showToast(locale === 'th' ? 'ส่งอีเมลทดสอบแล้ว' : 'Test email sent.')
    },
    onError: (error) => showToast(error instanceof Error ? error.message : 'Unable to send the test email.'),
  })

  function beginEdit(template: EmailTemplate) {
    setEditing(template)
    setForm({
      nameTh: template.nameTh, nameEn: template.nameEn,
      subjectTh: template.subjectTh, subjectEn: template.subjectEn,
      bodyTh: template.bodyTh, bodyEn: template.bodyEn,
      recipientRoles: template.recipientRoles,
      isEnabled: template.isEnabled,
    })
  }

  function setField<K extends keyof EditForm>(field: K, value: EditForm[K]) {
    setForm((current) => current ? { ...current, [field]: value } : current)
  }

  const columns = [
    {
      key: 'template', header: locale === 'th' ? 'เทมเพลต' : 'Template', render: (row: EmailTemplate) => (
        <div>
          <div className="font-semibold">{locale === 'th' ? row.nameTh : row.nameEn}</div>
          <div className="mt-1 text-xs text-gf-muted">{row.key}</div>
        </div>
      ),
    },
    {
      key: 'subject', header: locale === 'th' ? 'หัวข้ออีเมล' : 'Subject', render: (row: EmailTemplate) => (
        <span className="text-[13px] text-gf-muted">{(locale === 'th' ? row.subjectTh : row.subjectEn).slice(0, 70)}</span>
      ),
    },
    {
      key: 'status', header: locale === 'th' ? 'สถานะ' : 'Status', render: (row: EmailTemplate) => (
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', row.isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gf-pink-100 text-gf-muted')}>
          {row.isEnabled ? (locale === 'th' ? 'เปิดใช้งาน' : 'Enabled') : (locale === 'th' ? 'ปิดใช้งาน' : 'Disabled')}
        </span>
      ),
    },
    {
      key: 'updated', header: locale === 'th' ? 'แก้ไขล่าสุด' : 'Last edited', render: (row: EmailTemplate) => (
        <div className="text-xs text-gf-muted">
          <div>{new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { dateStyle: 'medium' }).format(new Date(row.updatedAt))}</div>
          {row.updatedByName && <div className="mt-1">{row.updatedByName}</div>}
        </div>
      ),
    },
    {
      key: 'actions', header: '', render: (row: EmailTemplate) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-[6px] border-0 bg-transparent p-2 text-gf-brown-700" onClick={(event) => event.stopPropagation()}>
            <MoreHorizontal size={17} />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem onClick={() => beginEdit(row)}>{locale === 'th' ? 'แก้ไข' : 'Edit'}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPreviewing(row)}>{locale === 'th' ? 'ดูตัวอย่าง' : 'Preview'}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTesting(row)}>{locale === 'th' ? 'ส่งอีเมลทดสอบ' : 'Send test'}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Communications', 'Email Templates']} title={locale === 'th' ? 'เทมเพลตอีเมล' : 'Email Templates'} />
      <p className="mb-5 mt-[-10px] text-sm text-gf-muted">
        {locale === 'th' ? 'ปรับข้อความสำหรับอีเมลแจ้งเตือนใหม่ การแก้ไขไม่มีผลกับประวัติที่ส่งแล้ว' : 'Edit future notification emails. Changes never alter sent-email history.'}
      </p>
      <DataTable columns={columns} data={templatesQuery.data ?? []} loading={templatesQuery.isLoading} />

      <FormDialog open={Boolean(editing && form)}
        onOpenChange={(open) => !open && (setEditing(null), setForm(null))}
        title={locale === 'th' ? 'แก้ไขเทมเพลตอีเมล' : 'Edit Email Template'}
        submitLabel={saveMutation.isPending ? (locale === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (locale === 'th' ? 'บันทึก' : 'Save')}
        onSubmit={() => editing && form && saveMutation.mutate({ id: editing.id, payload: form })}
        contentClassName="w-[calc(100vw-40px)] max-w-[1080px] sm:max-w-[1080px]"
      >
        {form && <div className="max-h-[calc(100vh-260px)] space-y-5 overflow-y-auto pr-1">
          <div className="flex items-center justify-between border-b border-gf-line pb-4">
            <span className="text-sm text-gf-muted">{editing?.key}</span>
            <button type="button" onClick={() => setField('isEnabled', !form.isEnabled)} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold', form.isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gf-pink-100 text-gf-muted')}>
              {form.isEnabled ? (locale === 'th' ? 'เปิดใช้งาน' : 'Enabled') : (locale === 'th' ? 'ปิดใช้งาน' : 'Disabled')}
            </button>
          </div>
          <RecipientSelector
            locale={locale}
            value={form.recipientRoles}
            onChange={(recipientRoles) => setField('recipientRoles', recipientRoles)}
          />
          <TemplateFields locale="th" form={form} onChange={setField} />
          <TemplateFields locale="en" form={form} onChange={setField} />
          <div><Label>{locale === 'th' ? 'ตัวแปรที่ใช้ได้' : 'Available variables'}</Label><div className="mt-2 flex flex-wrap gap-2">{editing?.availableVariables.map((variable) => <span key={variable} className="rounded-full bg-gf-pink-100 px-2.5 py-1 text-xs text-gf-brown-700">{variable}</span>)}</div></div>
        </div>}
      </FormDialog>

      <FormDialog open={Boolean(previewing)} onOpenChange={(open) => !open && setPreviewing(null)} title={locale === 'th' ? 'ตัวอย่างอีเมล' : 'Email Preview'} submitLabel={locale === 'th' ? 'ปิด' : 'Close'} onSubmit={() => setPreviewing(null)} contentClassName="max-w-[720px]">
        {previewing && <EmailPreview template={previewing} locale={locale} />}
      </FormDialog>

      <FormDialog open={Boolean(testing)} onOpenChange={(open) => !open && setTesting(null)} title={locale === 'th' ? 'ส่งอีเมลทดสอบ' : 'Send Test Email'} submitLabel={testMutation.isPending ? (locale === 'th' ? 'กำลังส่ง...' : 'Sending...') : (locale === 'th' ? 'ส่งอีเมล' : 'Send email')} onSubmit={() => testing && testMutation.mutate({ id: testing.id, payload: { email: testEmail, locale } })}>
        <div><Label>{locale === 'th' ? 'ส่งถึง' : 'Send to'}</Label><Input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} type="email" placeholder="you@example.com" className="mt-2" /></div>
      </FormDialog>
    </div>
  )
}

const RECIPIENT_OPTIONS: Array<{ value: EmailTemplateRecipientRole; th: string; en: string; detailTh: string; detailEn: string }> = [
  { value: 'renter', th: 'ผู้เช่า', en: 'Renter', detailTh: 'ผู้ที่ทำรายการเช่า', detailEn: 'The person renting the item' },
  { value: 'owner', th: 'เจ้าของสินค้า', en: 'Owner', detailTh: 'ผู้ปล่อยเช่าสินค้า', detailEn: 'The product owner' },
  { value: 'admin', th: 'ผู้ดูแลระบบ', en: 'Admin', detailTh: 'ผู้ดูแลระบบที่ยังใช้งาน', detailEn: 'Active administrators' },
]

function RecipientSelector({ locale, value, onChange }: { locale: 'th' | 'en'; value: EmailTemplateRecipientRole[]; onChange: (value: EmailTemplateRecipientRole[]) => void }) {
  const toggle = (role: EmailTemplateRecipientRole) => {
    if (value.includes(role)) {
      if (value.length === 1) return
      onChange(value.filter((item) => item !== role))
      return
    }
    onChange([...value, role])
  }
  return <section className="border-b border-gf-line pb-5"><div className="mb-3"><Label>{locale === 'th' ? 'ส่งการแจ้งเตือนไปยัง' : 'Send this notification to'}</Label><p className="mb-0 mt-1 text-xs text-gf-muted">{locale === 'th' ? 'เลือกอย่างน้อยหนึ่งกลุ่มผู้รับ' : 'Select at least one recipient group.'}</p></div><div className="grid gap-2 sm:grid-cols-3">{RECIPIENT_OPTIONS.map((option) => { const selected = value.includes(option.value); return <button key={option.value} type="button" onClick={() => toggle(option.value)} className={cn('min-h-[92px] rounded-[8px] border p-3 text-left transition-colors', selected ? 'border-gf-pink-500 bg-gf-pink-100/50' : 'border-gf-line bg-white hover:border-gf-pink-300')}><span className="flex items-center justify-between text-sm font-bold text-gf-brown-900">{locale === 'th' ? option.th : option.en}<span className={cn('flex size-5 items-center justify-center rounded-full border text-xs', selected ? 'border-gf-pink-500 bg-gf-pink-500 text-white' : 'border-gf-line text-transparent')}>✓</span></span><span className="mt-2 block text-xs leading-5 text-gf-muted">{locale === 'th' ? option.detailTh : option.detailEn}</span></button> })}</div></section>
}

function TemplateFields({ locale, form, onChange }: { locale: 'th' | 'en'; form: EditForm; onChange: <K extends keyof EditForm>(field: K, value: EditForm[K]) => void }) {
  const thai = locale === 'th'
  const suffix = thai ? 'Th' : 'En'
  const field = <K extends 'name' | 'subject' | 'body'>(name: K) => `${name}${suffix}` as keyof EditForm
  return <section className="grid gap-3 border-b border-gf-line pb-5"><div className="flex items-center gap-2"><Mail size={16} className="text-gf-pink-600" /><h2 className="m-0 text-sm font-bold text-gf-brown-900">{thai ? 'ภาษาไทย' : 'English'}</h2></div><div><Label>{thai ? 'ชื่อเทมเพลต' : 'Template name'}</Label><Input value={form[field('name')] as string} onChange={(event) => onChange(field('name'), event.target.value)} className="mt-1.5" /></div><div><Label>{thai ? 'หัวข้ออีเมล' : 'Subject line'}</Label><Input value={form[field('subject')] as string} onChange={(event) => onChange(field('subject'), event.target.value)} className="mt-1.5" /></div><div><Label>{thai ? 'เนื้อหา HTML' : 'HTML email body'}</Label><Textarea value={form[field('body')] as string} onChange={(event) => onChange(field('body'), event.target.value)} rows={9} className="mt-1.5 font-mono text-xs" /><p className="mb-0 mt-1.5 text-xs text-gf-muted">{thai ? 'รองรับ tag เช่น &lt;p&gt;, &lt;strong&gt;, &lt;a&gt; และตัวแปร {{action_url}}' : 'Use tags such as &lt;p&gt;, &lt;strong&gt;, and &lt;a&gt;, plus {{action_url}}.'}</p></div></section>
}

function EmailPreview({ template, locale }: { template: EmailTemplate; locale: 'th' | 'en' }) {
  const bodyHtml = renderEmailHtmlTemplate(
    locale === 'th' ? template.bodyTh : template.bodyEn,
    EMAIL_TEMPLATE_SAMPLE_VARIABLES,
  )
  const html = createGlowframeEmailHtml({
    title: locale === 'th' ? template.subjectTh : template.subjectEn,
    bodyHtml,
    actionUrl: EMAIL_TEMPLATE_SAMPLE_VARIABLES.action_url,
  })
  return <div className="overflow-hidden rounded-[8px] border border-gf-line bg-white"><div className="border-b border-gf-line px-5 py-4 text-sm"><div className="text-xs text-gf-muted">Subject</div><div className="mt-1 font-semibold text-gf-brown-900">{locale === 'th' ? template.subjectTh : template.subjectEn}</div></div><iframe title="Email preview" sandbox="" srcDoc={html} className="h-[520px] w-full border-0 bg-gf-pink-100" /></div>
}
