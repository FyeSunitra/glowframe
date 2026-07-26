'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Mail, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { DataTable } from '@/components/admin/shared/DataTable'
import { FormDialog } from '@/components/admin/shared/FormDialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { useMenuI18n } from '@/hooks/useMenuI18n'

interface EmailTemplate { id: number; key: string; name: string; subject: string; lastEdited: string; lastEditedBy: string }

const editSchema = z.object({ subject: z.string().min(1), body: z.string().min(1) })
const testSchema = z.object({ email: z.string().email() })
type EditForm = z.infer<typeof editSchema>
type TestForm = z.infer<typeof testSchema>

const VARIABLES: Record<string, string[]> = {
  welcome: ['{{user_name}}', '{{platform_name}}'],
  booking_confirmed: ['{{user_name}}', '{{booking_ref}}', '{{camera_name}}', '{{rental_dates}}'],
  booking_cancelled: ['{{user_name}}', '{{booking_ref}}'],
  booking_reminder: ['{{user_name}}', '{{booking_ref}}', '{{rental_start}}'],
  payout_processed: ['{{user_name}}', '{{amount}}'],
  id_verification_approved: ['{{user_name}}'],
  id_verification_rejected: ['{{user_name}}', '{{rejection_reason}}'],
  account_suspended: ['{{user_name}}', '{{suspension_reason}}'],
  password_reset: ['{{user_name}}', '{{reset_link}}'],
}

export default function EmailTemplatesPage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [editTarget, setEditTarget] = useState<EmailTemplate | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['admin', 'comms', 'email-templates'],
    queryFn: () => axios.get('/api/admin/comms/email-templates').then(r => r.data.data),
  })
  const saveMutation = useMutation({
    mutationFn: (data: EditForm & { id: number }) => axios.patch(`/api/admin/comms/email-templates/${data.id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'comms', 'email-templates'] }); showToast(tr('Template saved')) },
  })

  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })
  const testForm = useForm<TestForm>({ resolver: zodResolver(testSchema) })

  const vars = editTarget ? (VARIABLES[editTarget.key] ?? []) : []

  const COLUMNS = [
    { key: 'template', header: 'Template', render: (r: EmailTemplate) => (
      <span>
        <div className="font-[var(--font-poppins)] text-[12px] text-gf-muted [margin-bottom:2px]">{r.key}</div>
        <div className="font-semibold">{r.name}</div>
      </span>
    )},
    { key: 'subject', header: 'Subject line', render: (r: EmailTemplate) => <span className="text-[13px] text-gf-muted">{r.subject.slice(0, 50)}{r.subject.length > 50 ? '…' : ''}</span> },
    { key: 'lastEdited', header: 'Last edited', render: (r: EmailTemplate) => (
      <span>
        <div className="text-[12.5px]">{r.lastEdited}</div>
        <div className="text-[12px] text-gf-muted">{r.lastEditedBy}</div>
      </span>
    )},
    { key: 'actions', header: '', render: (r: EmailTemplate) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setEditTarget(r); editForm.reset({ subject: r.subject, body: '' }); setEditOpen(true) }}>{tr('Edit')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setEditTarget(r); setPreviewOpen(true) }}>{tr('Preview')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setEditTarget(r); testForm.reset(); setTestOpen(true) }}>{tr('Send test')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Communications', 'Email Templates']} title="Email Templates" />
      <DataTable columns={COLUMNS} data={templates} loading={isLoading} />

      <FormDialog open={editOpen} onOpenChange={setEditOpen} title={`Edit — ${editTarget?.name}`} submitLabel="Save template" onSubmit={editForm.handleSubmit(data => { if (editTarget) saveMutation.mutate({ ...data, id: editTarget.id }); setEditOpen(false) })}>
        <form className="flex flex-col gap-[12px]">
          <div><Label>Subject line</Label><Input {...editForm.register('subject')} className="[margin-top:6px]" /></div>
          <div>
            <Label>Body</Label>
            <Textarea {...editForm.register('body')} rows={8} className="[margin-top:6px]" />
          </div>
          {vars.length > 0 && (
            <div>
              <Label className="block [margin-bottom:6px]">Available variables</Label>
              <div className="flex flex-wrap gap-[6px]">
                {vars.map(v => (
                  <button key={v} type="button" onClick={() => { const cur = editForm.getValues('body'); editForm.setValue('body', cur + v) }} className="text-[12px] font-[var(--font-poppins)] [padding:3px_10px] rounded-full bg-gf-pink-100 border-0 cursor-pointer text-gf-brown-700">{v}</button>
                ))}
              </div>
            </div>
          )}
        </form>
      </FormDialog>

      <FormDialog open={previewOpen} onOpenChange={setPreviewOpen} title={`Preview — ${editTarget?.name}`} submitLabel="Close" onSubmit={() => setPreviewOpen(false)}>
        <div className="bg-gf-pink-100 rounded-[14px] [padding:20px] text-[13px] [line-height:1.8]">
          <strong>{tr('Subject')}:</strong> {editTarget?.subject}<br /><br />
          [Rendered email preview would appear here]
        </div>
      </FormDialog>

      <FormDialog open={testOpen} onOpenChange={setTestOpen} title="Send Test Email" submitLabel="Send" onSubmit={testForm.handleSubmit(() => { showToast(tr('Test email sent')); setTestOpen(false) })}>
        <form><Label>Send test to</Label><Input type="email" {...testForm.register('email')} placeholder="you@example.com" className="[margin-top:6px]" /></form>
      </FormDialog>
    </div>
  )
}
