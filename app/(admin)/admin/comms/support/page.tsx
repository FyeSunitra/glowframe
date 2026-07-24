'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { LifeBuoy, MoreHorizontal } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { DetailDrawer } from '@/components/admin/shared/DetailDrawer'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { PillTabs } from '@/components/admin/shared/PillTabs'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'

interface Ticket { id: number; ticketId: string; user: { displayName: string }; category: string; subject: string; priority: string; assignee: string | null; opened: string; lastReply: string; status: string }

const CATEGORY_OPTIONS = [{ value: '', label: 'All categories' }, { value: 'booking', label: 'Booking' }, { value: 'payment', label: 'Payment' }, { value: 'account', label: 'Account' }, { value: 'listing', label: 'Listing' }, { value: 'other', label: 'Other' }]
const PRIORITY_OPTIONS = [{ value: '', label: 'All priority' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]
const TABS = ['Open', 'In Progress', 'Resolved', 'Closed']

const replySchema = z.object({ message: z.string().min(1) })
type ReplyForm = z.infer<typeof replySchema>

const MOCK_THREAD = [
  { id: 1, from: 'user', message: 'I was charged but my booking was not confirmed. Please help.', time: '17 Jul 2026 10:00' },
  { id: 2, from: 'admin', message: 'Thank you for reaching out. We are investigating your payment and will update you within 24 hours.', time: '17 Jul 2026 14:30' },
]

export default function SupportPage() {
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('Open')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('')
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)

  const tab = activeTab === 'In Progress' ? 'in-progress' : activeTab.toLowerCase()
  const filters = { search, category, priority, tab }
  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['admin', 'comms', 'support', filters],
    queryFn: () => axios.get('/api/admin/comms/support', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'comms', 'support'] })
  const assignMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/comms/support/${id}`, { action: 'assign' }), onSuccess: () => { invalidate(); showToast('Assigned to you') } })
  const resolveMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/comms/support/${id}`, { action: 'resolve' }), onSuccess: () => { invalidate(); showToast('Ticket resolved') } })
  const closeMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/comms/support/${id}`, { action: 'close' }), onSuccess: () => { invalidate(); showToast('Ticket closed') } })

  const replyForm = useForm<ReplyForm>({ resolver: zodResolver(replySchema) })

  const COLUMNS = [
    { key: 'ticketId', header: 'Ticket ID', render: (r: Ticket) => <span className="font-[var(--font-poppins)] font-semibold">{r.ticketId}</span> },
    { key: 'user', header: 'User', render: (r: Ticket) => r.user.displayName },
    { key: 'category', header: 'Category', render: (r: Ticket) => <span className="[text-transform:capitalize]">{r.category}</span> },
    { key: 'subject', header: 'Subject', render: (r: Ticket) => <span className="text-[13px]">{r.subject.slice(0, 60)}{r.subject.length > 60 ? '…' : ''}</span> },
    { key: 'priority', header: 'Priority', render: (r: Ticket) => <StatusBadge status={r.priority} /> },
    { key: 'assignee', header: 'Assignee', render: (r: Ticket) => r.assignee ?? <span className="text-gf-muted text-[12.5px]">Unassigned</span> },
    { key: 'opened', header: 'Opened', render: (r: Ticket) => <span className="text-[12.5px] text-gf-muted">{r.opened}</span> },
    { key: 'lastReply', header: 'Last reply', render: (r: Ticket) => <span className="text-[12.5px] text-gf-muted">{r.lastReply}</span> },
    { key: 'status', header: 'Status', render: (r: Ticket) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: Ticket) => (
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-transparent border-0 cursor-pointer [padding:4px_8px] rounded-[8px] text-gf-brown-700" onClick={e => e.stopPropagation()}><MoreHorizontal size={16} /></DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem onClick={() => { setSelected(r); setDrawerOpen(true) }}>View & Reply</DropdownMenuItem>
          <DropdownMenuItem onClick={() => assignMutation.mutate(r.id)}>Assign to me</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); setResolveOpen(true) }}>Resolve</DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSelected(r); setCloseOpen(true) }}>Close</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Communications', 'Support']} title="Support Tickets" />
      <PillTabs items={TABS} value={activeTab} onChange={setActiveTab} />
      <FilterBar
        search={{ placeholder: 'Search ticket or subject…', value: search, onChange: setSearch }}
        selects={[
          { label: 'Category', value: category, onChange: setCategory, options: CATEGORY_OPTIONS },
          { label: 'Priority', value: priority, onChange: setPriority, options: PRIORITY_OPTIONS },
        ]}
      />
      <DataTable columns={COLUMNS} data={tickets} loading={isLoading} empty={<EmptyState icon={LifeBuoy} heading="No open tickets" sub="User support tickets appear here." />} />

      <DetailDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={selected ? `${selected.ticketId} — ${selected.subject.slice(0, 40)}` : ''}
        footer={
          <div className="flex gap-[10px]">
            <Textarea {...replyForm.register('message')} placeholder="Type your reply…" className="flex-1 h-[40px] [resize:none]" />
            <button onClick={replyForm.handleSubmit(() => { showToast('Reply sent'); replyForm.reset() })} className="bg-gf-pink-500 text-gf-brown-900 border-0 rounded-full [padding:0_20px] font-semibold cursor-pointer whitespace-nowrap">Send</button>
          </div>
        }
      >
        {selected && (
          <div>
            <div className="flex gap-[8px] [margin-bottom:16px]">
              <StatusBadge status={selected.category} />
              <StatusBadge status={selected.priority} />
              <StatusBadge status={selected.status} />
            </div>
            <div className="bg-white rounded-[14px] [box-shadow:var(--gf-shadow-sm)] [padding:18px] [margin-bottom:16px] text-[13px] [line-height:1.6]">
              {selected.subject}
            </div>
            {MOCK_THREAD.map(msg => (
              <div key={msg.id} className={cn('mb-3 flex', msg.from === 'admin' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[80%] rounded-[14px] px-4 py-3 text-[13px] leading-[1.6]',
                  msg.from === 'admin' ? 'bg-gf-brown-800 text-gf-pink-100' : 'bg-gf-pink-100',
                )}>
                  <div>{msg.message}</div>
                  <div className="text-[11px] [margin-top:4px] opacity-[0.6]">{msg.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog open={resolveOpen} onOpenChange={setResolveOpen} title="Resolve this ticket?" description="The ticket will be marked as resolved." onConfirm={() => { if (selected) resolveMutation.mutate(selected.id); setResolveOpen(false) }} />
      <ConfirmDialog open={closeOpen} onOpenChange={setCloseOpen} title="Close this ticket?" description="The ticket will be closed and no further replies accepted." onConfirm={() => { if (selected) closeMutation.mutate(selected.id); setCloseOpen(false) }} />
    </div>
  )
}
