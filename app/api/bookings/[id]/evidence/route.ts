import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

import { setSessionCookies } from '@/lib/auth/server'
import { getCloudinary } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { getBookingRequestContext } from '../../_auth'

type EvidenceKind = 'delivery' | 'return' | 'damage'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json()
    const kind = parseKind(body?.kind)
    if (!kind) {
      return NextResponse.json({ error: 'Evidence kind is invalid.' }, { status: 400 })
    }
    const resolved = await accessibleBooking(context, kind)
    if (!resolved.ok) return resolved.response

    const { client, cloudName, apiKey, apiSecret } = getCloudinary()
    const timestamp = Math.floor(Date.now() / 1000)
    const folder =
      `glowframe/bookings/${resolved.bookingId}/${kind}/${randomUUID()}`
    const signature = client.utils.api_sign_request(
      { folder, timestamp },
      apiSecret,
    )
    const response = NextResponse.json({
      data: { cloudName, apiKey, timestamp, folder, signature },
    })
    if (resolved.auth.refreshedSession) {
      setSessionCookies(response, resolved.auth.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to prepare booking evidence upload', error)
    return NextResponse.json(
      { error: 'Unable to prepare evidence upload.' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const body = await request.json()
    const kind = parseKind(body?.kind)
    if (!kind) {
      return NextResponse.json({ error: 'Evidence kind is invalid.' }, { status: 400 })
    }
    const resolved = await accessibleBooking(context, kind)
    if (!resolved.ok) return resolved.response
    const publicId = typeof body?.publicId === 'string' ? body.publicId : ''
    const prefix = `glowframe/bookings/${resolved.bookingId}/${kind}/`
    if (!publicId.startsWith(prefix)) {
      return NextResponse.json({ error: 'Evidence is invalid.' }, { status: 400 })
    }

    const { client } = getCloudinary()
    await client.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    })
    const response = NextResponse.json({ data: null })
    if (resolved.auth.refreshedSession) {
      setSessionCookies(response, resolved.auth.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to clean up booking evidence', error)
    return NextResponse.json(
      { error: 'Unable to clean up evidence.' },
      { status: 500 },
    )
  }
}

async function accessibleBooking(
  context: { params: Promise<{ id: string }> },
  kind: EvidenceKind,
) {
  const auth = await getBookingRequestContext()
  if (!auth) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 }),
    }
  }
  const { id } = await context.params
  if (!/^\d+$/.test(id)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Booking id is invalid.' }, { status: 400 }),
    }
  }
  const bookingId = BigInt(id)
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, ownerId: true, renterId: true },
  })
  if (!booking) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Booking was not found.' }, { status: 404 }),
    }
  }
  const isAllowed =
    kind === 'return'
      ? booking.renterId === auth.user.id
      : booking.ownerId === auth.user.id
  if (!isAllowed) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'You cannot manage this booking evidence.' },
        { status: 403 },
      ),
    }
  }
  return { ok: true as const, auth, bookingId: id }
}

function parseKind(value: unknown): EvidenceKind | null {
  return value === 'delivery' || value === 'return' || value === 'damage'
    ? value
    : null
}
