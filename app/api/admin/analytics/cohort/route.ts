import { NextResponse } from 'next/server'

const COHORT_STATS = { conversionRate30d: 38, ownerFirstRentalTime: 12, repeatRentalRate: 44, monthlyActiveRenters: 287 }

const COHORT_TABLE = [
  { cohort: 'Jan 2026', w1: 12, w2: 22, w3: 28, w4: 35, m2: 44, m3: 48 },
  { cohort: 'Feb 2026', w1: 15, w2: 25, w3: 32, w4: 38, m2: 45, m3: 50 },
  { cohort: 'Mar 2026', w1: 10, w2: 18, w3: 25, w4: 30, m2: 38, m3: null },
  { cohort: 'Apr 2026', w1: 18, w2: 28, w3: 36, w4: 42, m2: null, m3: null },
  { cohort: 'May 2026', w1: 14, w2: 24, w3: 31, w4: null, m2: null, m3: null },
  { cohort: 'Jun 2026', w1: 20, w2: 30, w3: null, w4: null, m2: null, m3: null },
]

const ACTIVATION_FUNNEL = [
  { stage: 'Signed up as owner', count: 320, pct: 100 },
  { stage: 'Created first listing', count: 198, pct: 62 },
  { stage: 'Listing approved', count: 156, pct: 49 },
  { stage: 'Received first booking', count: 89, pct: 28 },
  { stage: 'Received first payout', count: 82, pct: 26 },
]

const REPEAT_RATE = [
  { range: '1 (one-time)', renters: 492, pct: 56 },
  { range: '2–3', renters: 241, pct: 27 },
  { range: '4–10', renters: 106, pct: 12 },
  { range: '10+', renters: 44, pct: 5 },
]

export async function GET() {
  return NextResponse.json({ data: { stats: COHORT_STATS, cohortTable: COHORT_TABLE, activationFunnel: ACTIVATION_FUNNEL, repeatRate: REPEAT_RATE } })
}
