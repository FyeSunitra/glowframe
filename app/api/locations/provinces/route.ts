import { NextResponse } from 'next/server'
import type { Province } from '@/types/location'

const GEOTH_URL = 'https://geoth.thiti.dev/api'

export async function GET() {
  try {
    const response = await fetch(`${GEOTH_URL}/provinces/all`, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`GeoTH returned ${response.status}`)

    const provinces = (await response.json()) as Province[]
    return NextResponse.json({ data: provinces })
  } catch (error) {
    console.error('Failed to load GeoTH provinces', error)
    return NextResponse.json(
      { error: 'Unable to load province data.' },
      { status: 502 },
    )
  }
}
