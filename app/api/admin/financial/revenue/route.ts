import { NextRequest, NextResponse } from 'next/server'

const REVENUE_DATA = [
  { period: 'Jul 2026', transactions: 34, grossVolume: 125000, platformFees: 12500, refunds: 5750, netRevenue: 6750 },
  { period: 'Jun 2026', transactions: 28, grossVolume: 98500, platformFees: 9850, refunds: 1450, netRevenue: 8400 },
  { period: 'May 2026', transactions: 21, grossVolume: 74200, platformFees: 7420, refunds: 2100, netRevenue: 5320 },
  { period: 'Apr 2026', transactions: 15, grossVolume: 51000, platformFees: 5100, refunds: 800, netRevenue: 4300 },
]

export async function GET(req: NextRequest) {
  const period = new URL(req.url).searchParams.get('period') ?? 'this-month'
  const data = period === 'today' ? REVENUE_DATA.slice(0, 1) : REVENUE_DATA
  const stats = {
    grossVolume: data.reduce((s, r) => s + r.grossVolume, 0),
    platformFees: data.reduce((s, r) => s + r.platformFees, 0),
    refunds: data.reduce((s, r) => s + r.refunds, 0),
    netRevenue: data.reduce((s, r) => s + r.netRevenue, 0),
  }
  return NextResponse.json({ data, stats })
}
