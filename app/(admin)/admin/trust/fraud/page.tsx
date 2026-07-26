'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { Zap, AlertCircle, Minus, ChevronUp } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/shared/AdminPageHeader'
import { FilterBar } from '@/components/admin/shared/FilterBar'
import { DataTable } from '@/components/admin/shared/DataTable'
import { StatusBadge } from '@/components/admin/shared/StatusBadge'
import { EmptyState } from '@/components/admin/shared/EmptyState'
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/useToast'
import { useMenuI18n } from '@/hooks/useMenuI18n'

interface FraudSignal { id: number; signalType: string; entity: string; severity: string; triggeredRule: string; detected: string; status: string }

const SIGNAL_OPTIONS = [{ value: '', label: 'All signals' }, { value: 'payment-failure', label: 'Payment failure' }, { value: 'duplicate-account', label: 'Duplicate account' }, { value: 'high-deposit', label: 'High deposit' }, { value: 'rapid-booking', label: 'Rapid booking' }, { value: 'suspicious-ip', label: 'Suspicious IP' }]
const SEVERITY_OPTIONS = [{ value: '', label: 'All severity' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]
const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, { value: 'open', label: 'Open' }, { value: 'dismissed', label: 'Dismissed' }, { value: 'escalated', label: 'Escalated' }]

const SIGNAL_ICONS: Record<string, React.ReactNode> = {
  'payment-failure': <AlertCircle size={14} />,
  'duplicate-account': <Minus size={14} />,
  'rapid-booking': <ChevronUp size={14} />,
  'high-deposit': <ChevronUp size={14} />,
  'suspicious-ip': <AlertCircle size={14} />,
}

export default function FraudPage() {
  const { tr } = useMenuI18n()
  const { showToast } = useToast()
  const qc = useQueryClient()
  const [signalType, setSignalType] = useState('')
  const [severity, setSeverity] = useState('')
  const [status, setStatus] = useState('')
  const [dismissId, setDismissId] = useState<number | null>(null)

  const filters = { 'signal-type': signalType, severity, status }
  const { data: signals = [], isLoading } = useQuery<FraudSignal[]>({
    queryKey: ['admin', 'trust', 'fraud', filters],
    queryFn: () => axios.get('/api/admin/trust/fraud', { params: filters }).then(r => r.data.data),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'trust', 'fraud'] })
  const dismissMutation = useMutation({ mutationFn: (id: number) => axios.patch(`/api/admin/trust/fraud/${id}`, { action: 'dismiss' }), onSuccess: () => { invalidate(); showToast(tr('Signal dismissed')) } })

  const COLUMNS = [
    { key: 'signalType', header: 'Signal type', render: (r: FraudSignal) => (
      <span className="flex items-center gap-[6px]">
        {SIGNAL_ICONS[r.signalType] ?? <Zap size={14} />}
        <span className="[text-transform:capitalize]">{r.signalType.replace(/-/g, ' ')}</span>
      </span>
    )},
    { key: 'entity', header: 'Entity', render: (r: FraudSignal) => r.entity },
    { key: 'severity', header: 'Severity', render: (r: FraudSignal) => <StatusBadge status={r.severity} /> },
    { key: 'triggeredRule', header: 'Triggered rule', render: (r: FraudSignal) => <span className="text-[12.5px] text-gf-muted">{r.triggeredRule}</span> },
    { key: 'detected', header: 'Detected', render: (r: FraudSignal) => <span className="text-[12.5px] text-gf-muted">{r.detected}</span> },
    { key: 'status', header: 'Status', render: (r: FraudSignal) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: '', render: (r: FraudSignal) => (
      <span className="flex gap-[6px]">
        <button onClick={() => setDismissId(r.id)} className="text-[12px] [padding:4px_10px] rounded-full [border:1.5px_solid_var(--gf-brown-300)] bg-transparent cursor-pointer text-gf-brown-700">{tr('Dismiss')}</button>
        <button onClick={() => showToast(tr('Escalated to disputes'))} className="text-[12px] [padding:4px_10px] rounded-full border-0 bg-gf-pink-500 cursor-pointer text-gf-brown-900 font-semibold">{tr('Escalate')}</button>
      </span>
    )},
  ]

  return (
    <div className="animate-fade-up">
      <AdminPageHeader breadcrumb={['Admin', 'Trust & Safety', 'Fraud']} title="Fraud & Risk Signals" />
      <FilterBar
        selects={[
          { label: 'Signal type', value: signalType, onChange: setSignalType, options: SIGNAL_OPTIONS },
          { label: 'Severity', value: severity, onChange: setSeverity, options: SEVERITY_OPTIONS },
          { label: 'Status', value: status, onChange: setStatus, options: STATUS_OPTIONS },
        ]}
      />
      <DataTable columns={COLUMNS} data={signals} loading={isLoading} empty={<EmptyState icon={Zap} heading="No risk signals detected" sub="Automated risk flags appear here when triggered." />} />
      <ConfirmDialog open={dismissId !== null} onOpenChange={open => { if (!open) setDismissId(null) }} title="Dismiss this signal?" description="The signal will be marked as reviewed and dismissed." onConfirm={() => { if (dismissId !== null) dismissMutation.mutate(dismissId); setDismissId(null) }} />
    </div>
  )
}
