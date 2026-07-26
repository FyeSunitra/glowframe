import { NextResponse } from 'next/server'
import type { District } from '@/types/location'

const GEOTH_URL = 'https://geoth.thiti.dev/api'

interface ProvinceWithDistricts {
  districts: District[]
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Province not found.' }, { status: 404 })
  }

  try {
    const response = await fetch(`${GEOTH_URL}/provinces-with-districts/${id}`, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`GeoTH returned ${response.status}`)

    const province = (await response.json()) as ProvinceWithDistricts
    return NextResponse.json({ data: province.districts ?? [] })
  } catch (error) {
    console.error('Failed to load GeoTH districts', error)
    return NextResponse.json(
      { error: 'Unable to load district data.' },
      { status: 502 },
    )
  }
}
