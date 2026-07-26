'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { useMenuI18n } from '@/hooks/useMenuI18n'

interface MaintenanceConfig { enabled: boolean; message: string; estimatedDate: string; estimatedTime: string; ipWhitelist: string }

const schema = z.object({
  message: z.string().min(1),
  estimatedDate: z.string().optional(),
  estimatedTime: z.string().optional(),
  ipWhitelist: z.string().optional(),
})
type MaintForm = z.infer<typeof schema>

export default function MaintenancePage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [toggleOpen, setToggleOpen] = useState(false)

  const { data: config } = useQuery<MaintenanceConfig>({
    queryKey: ['admin', 'config', 'maintenance'],
    queryFn: () => axios.get('/api/admin/config/maintenance').then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'config', 'maintenance'] })
  const saveMutation = useMutation({
    mutationFn: (data: Partial<MaintenanceConfig>) => axios.patch('/api/admin/config/maintenance', data),
    onSuccess: () => { invalidate(); showToast(tr('Settings saved')) },
  })
  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => axios.patch('/api/admin/config/maintenance', { enabled }),
    onSuccess: () => { invalidate(); showToast(tr(config?.enabled ? 'Maintenance mode disabled' : 'Maintenance mode enabled')) },
  })

  const form = useForm<MaintForm>({
    resolver: zodResolver(schema),
    values: config ? { message: config.message, estimatedDate: config.estimatedDate, estimatedTime: config.estimatedTime, ipWhitelist: config.ipWhitelist } : undefined,
  })

  const isOn = config?.enabled ?? false

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Platform Config', 'Maintenance Mode']} title="Maintenance Mode" />

      <div className="rounded-[22px] bg-white p-7 shadow-[var(--gf-shadow)]">
        <div className="text-[16px] font-bold text-gf-brown-900 font-[var(--font-poppins)] [margin-bottom:16px]">
          {tr('Maintenance Mode')}
        </div>
        <div className="flex items-center gap-[14px] [margin-bottom:20px]">
          <StatusBadge status={isOn ? 'rejected' : 'active'} />
          <span className={cn('text-[15px] font-semibold', isOn ? 'text-gf-red' : 'text-gf-green')}>
            {tr(isOn ? 'ON — Site is offline for users' : 'OFF — Site is live')}
          </span>
        </div>
        <button
          onClick={() => setToggleOpen(true)}
          className={cn(
            'cursor-pointer rounded-full border-0 px-[22px] py-[11px] font-semibold text-white',
            isOn ? 'bg-gf-green' : 'bg-gf-red',
          )}
        >
          {tr(isOn ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode')}
        </button>

        <Separator className="[margin:24px_0]" />

        <form onSubmit={form.handleSubmit(data => saveMutation.mutate(data))} className="flex flex-col gap-[16px] max-w-[560px]">
          <div>
            <Label>Maintenance message (shown to visitors)</Label>
            <Textarea rows={3} {...form.register('message')} placeholder="We're performing scheduled maintenance. We'll be back shortly." className="[margin-top:6px]" />
          </div>
          <div>
            <Label>Estimated restoration time</Label>
            <div className="flex gap-[12px] [margin-top:6px]">
              <Input type="date" {...form.register('estimatedDate')} className="flex-1" />
              <Input type="time" {...form.register('estimatedTime')} className="flex-1" />
            </div>
          </div>
          <div>
            <Label>IP whitelist (admins who can still access the site)</Label>
            <Textarea rows={3} {...form.register('ipWhitelist')} placeholder="One IP per line" className="[margin-top:6px]" />
          </div>
          <div>
            <button type="submit" className="bg-gf-pink-500 text-gf-brown-900 rounded-full [padding:11px_22px] font-semibold border-0 cursor-pointer">
              {tr('Save settings')}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={isOn ? 'Disable maintenance mode?' : 'Enable maintenance mode?'}
        description={isOn
          ? 'This will restore the site to all users immediately.'
          : 'This will show the maintenance page to all users immediately. Admin IPs in the whitelist will still have access.'}
        destructive={!isOn}
        onConfirm={() => { toggleMutation.mutate(!isOn); setToggleOpen(false) }}
      />
    </div>
  )
}
