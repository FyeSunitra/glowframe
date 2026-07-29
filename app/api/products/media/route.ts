import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

import { getCloudinary } from '@/lib/cloudinary'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  setSessionCookies,
  syncSupabaseUser,
} from '@/lib/auth/server'
import { VerificationStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import type { ProductMediaInput } from '@/types/product'

export async function POST() {
  try {
    const authenticated = await verifiedOwner()
    if (!authenticated.ok) {
      return NextResponse.json(
        { error: authenticated.error },
        { status: authenticated.status },
      )
    }

    const { client, cloudName, apiKey, apiSecret } = getCloudinary()
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = `glowframe/products/${authenticated.userId}/${randomUUID()}`
    const signature = client.utils.api_sign_request(
      { folder, timestamp },
      apiSecret,
    )

    const response = NextResponse.json({
      data: {
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
      },
    })
    if (authenticated.refreshedSession) {
      setSessionCookies(response, authenticated.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to create Cloudinary product upload signature', error)
    return NextResponse.json(
      { error: 'Unable to prepare product media upload.' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authenticated = await verifiedOwner()
    if (!authenticated.ok) {
      return NextResponse.json(
        { error: authenticated.error },
        { status: authenticated.status },
      )
    }

    const body = await request.json()
    const media = Array.isArray(body?.media)
      ? (body.media as Partial<ProductMediaInput>[])
      : []
    const allowedPrefix = `glowframe/products/${authenticated.userId}/`
    const ownedMedia = media.filter(
      (item): item is ProductMediaInput =>
        (item.mediaType === 'image' || item.mediaType === 'video') &&
        typeof item.publicId === 'string' &&
        item.publicId.startsWith(allowedPrefix),
    )

    const { client } = getCloudinary()
    await Promise.allSettled(
      ownedMedia.map((item) =>
        client.uploader.destroy(item.publicId, {
          resource_type: item.mediaType,
          invalidate: true,
        }),
      ),
    )

    const response = NextResponse.json({ data: null })
    if (authenticated.refreshedSession) {
      setSessionCookies(response, authenticated.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to clean up Cloudinary product media', error)
    return NextResponse.json(
      { error: 'Unable to clean up product media.' },
      { status: 500 },
    )
  }
}

async function verifiedOwner() {
  const cookieStore = await cookies()
  const resolved = await resolveSession(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  )
  if (!resolved) {
    return {
      ok: false as const,
      error: 'Unauthenticated.',
      status: 401,
    }
  }

  const user = await syncSupabaseUser(resolved.user)
  const verification = await prisma.identityVerification.findFirst({
    where: {
      userId: user.id,
      status: VerificationStatus.approved,
      reviewedBy: { not: null },
    },
    select: { id: true },
  })
  if (!verification) {
    return {
      ok: false as const,
      error: 'Admin-approved identity verification is required.',
      status: 403,
    }
  }

  return {
    ok: true as const,
    userId: user.id,
    refreshedSession: resolved.session,
  }
}
