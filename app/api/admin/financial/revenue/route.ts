import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { BookingStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    const period = parsePeriod(request.nextUrl.searchParams.get('period'))
    const { from, to } = periodRange(period)
    const bookings = await prisma.booking.findMany({
      where: { status: BookingStatus.completed, completedAt: { gte: from, lt: to } },
      select: {
        completedAt: true, totalAmount: true, rentalFee: true, platformFeeAmount: true,
        ownerReceivableAmount: true, depositSnapshot: true,
        rentalReturn: { select: { approvedDamageAmount: true } },
      },
      orderBy: { completedAt: 'asc' },
    })
    const rows = new Map<string, { period: string; transactions: number; grossVolume: number; rentalAmount: number; platformFees: number; ownerReceivables: number; depositReturns: number }>()
    for (const booking of bookings) {
      if (!booking.completedAt) continue
      const key = booking.completedAt.toISOString().slice(0, 10)
      const row = rows.get(key) ?? { period: key, transactions: 0, grossVolume: 0, rentalAmount: 0, platformFees: 0, ownerReceivables: 0, depositReturns: 0 }
      row.transactions += 1
      row.grossVolume += Number(booking.totalAmount)
      row.rentalAmount += Number(booking.rentalFee)
      row.platformFees += Number(booking.platformFeeAmount)
      row.ownerReceivables += Number(booking.ownerReceivableAmount)
      row.depositReturns += Math.max(0, Number(booking.depositSnapshot) - Number(booking.rentalReturn?.approvedDamageAmount ?? 0))
      rows.set(key, row)
    }
    const values = [...rows.values()].reverse()
    const stats = values.reduce((total, row) => ({
      grossVolume: total.grossVolume + row.grossVolume,
      platformFees: total.platformFees + row.platformFees,
      ownerReceivables: total.ownerReceivables + row.ownerReceivables,
      depositReturns: total.depositReturns + row.depositReturns,
      completedBookings: total.completedBookings + row.transactions,
    }), { grossVolume: 0, platformFees: 0, ownerReceivables: 0, depositReturns: 0, completedBookings: 0 })
    const response = NextResponse.json({ data: { rows: values, stats } })
    if (admin.refreshedSession) setSessionCookies(response, admin.refreshedSession)
    return response
  } catch (error) {
    console.error('Failed to load revenue data', error)
    return NextResponse.json({ error: 'Unable to load revenue data.' }, { status: 500 })
  }
}

function parsePeriod(value: string | null) {
  return value === 'today' || value === 'this-week' || value === 'last-month' ? value : 'this-month'
}

function periodRange(period: ReturnType<typeof parsePeriod>) {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (period === 'today') return { from: today, to: addDays(today, 1) }
  if (period === 'this-week') {
    const day = today.getUTCDay() || 7
    const from = addDays(today, 1 - day)
    return { from, to: addDays(from, 7) }
  }
  if (period === 'last-month') {
    return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)), to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) }
  }
  return { from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)) }
}

function addDays(value: Date, days: number) {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}
