import { NextResponse } from 'next/server'
import type { Subdistrict } from '@/types/location'

const GEOTH_URL = 'https://geoth.thiti.dev/api'

interface DistrictWithSubdistricts {
  subdistricts: Subdistrict[]
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'District not found.' }, { status: 404 })
  }

  try {
    const response = await fetch(`${GEOTH_URL}/districts-with-subdistricts/${id}`, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`GeoTH returned ${response.status}`)

    const district = (await response.json()) as DistrictWithSubdistricts
    return NextResponse.json({ data: district.subdistricts ?? [] })
  } catch (error) {
    console.error('Failed to load GeoTH subdistricts', error)
    return NextResponse.json(
      { error: 'Unable to load subdistrict data.' },
      { status: 502 },
    )
  }
}
