import { NextRequest, NextResponse } from 'next/server'

export const FRAUD_SIGNALS = [
  { id: 1, signalType: 'payment-failure', entity: 'Teerapat W.', severity: 'high', triggeredRule: '3 failed payment attempts within 24h', detected: '18 Jul 2026', status: 'open' },
  { id: 2, signalType: 'duplicate-account', entity: 'Unknown User', severity: 'medium', triggeredRule: 'Same device ID linked to 2 accounts', detected: '17 Jul 2026', status: 'open' },
  { id: 3, signalType: 'rapid-booking', entity: 'Pim A.', severity: 'low', triggeredRule: '5 bookings in 2 hours from new account', detected: '16 Jul 2026', status: 'dismissed' },
  { id: 4, signalType: 'high-deposit', entity: 'Fujifilm X-T5 listing', severity: 'medium', triggeredRule: 'Deposit > 10× price/day ratio', detected: '15 Jul 2026', status: 'open' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const signalType = searchParams.get('signal-type') ?? ''
  const severity = searchParams.get('severity') ?? ''
  const status = searchParams.get('status') ?? ''
  let result = [...FRAUD_SIGNALS]
  if (signalType) result = result.filter(f => f.signalType === signalType)
  if (severity) result = result.filter(f => f.severity === severity)
  if (status) result = result.filter(f => f.status === status)
  return NextResponse.json({ data: result })
}
