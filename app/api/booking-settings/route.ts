import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

const DEFAULT_MIN_ADVANCE_DAYS = 5

/** Public booking rule required by the rental date picker. */
export async function GET() {
  try {
    const settings = await prisma.platformSetting.findUnique({
      where: { id: 1 },
      select: { minAdvanceDays: true },
    })

    return NextResponse.json(
      { data: { minAdvanceDays: settings?.minAdvanceDays ?? DEFAULT_MIN_ADVANCE_DAYS } },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Failed to load public booking settings', error)
    return NextResponse.json({ error: 'Unable to load booking settings.' }, { status: 500 })
  }
}
