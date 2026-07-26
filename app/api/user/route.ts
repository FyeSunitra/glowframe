import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { VerificationStatus } from '@/lib/generated/prisma/client'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  setSessionCookies,
  syncSupabaseUser,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

async function authenticatedUser() {
  const cookieStore = await cookies()
  const resolved = await resolveSession(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  )
  if (!resolved) return null

  const user = await syncSupabaseUser(resolved.user)
  return { user, refreshedSession: resolved.session }
}

async function profileData(userId: bigint) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      identityVerifications: {
        where: {
          status: VerificationStatus.approved,
          reviewedBy: { not: null },
        },
        select: { id: true },
        take: 1,
      },
    },
  })

  return {
    id: Number(user.id),
    displayName: user.displayName,
    fullName: user.fullName ?? '',
    email: user.email,
    phone: user.phone ?? '',
    profileImageUrl: user.profileImageUrl,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phone),
    identityVerified: user.identityVerifications.length > 0,
  }
}

export async function GET() {
  try {
    const authenticated = await authenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const response = NextResponse.json({
      data: await profileData(authenticated.user.id),
    })
    if (authenticated.refreshedSession) {
      setSessionCookies(response, authenticated.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load profile', error)
    return NextResponse.json({ error: 'Unable to load profile.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authenticated = await authenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const body = await request.json()
    const displayName =
      typeof body.displayName === 'string' ? body.displayName.trim() : ''
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (!displayName) {
      return NextResponse.json({ error: 'Display name is required.' }, { status: 400 })
    }
    if (displayName.length > 120 || fullName.length > 160 || phone.length > 40) {
      return NextResponse.json({ error: 'Profile information is too long.' }, { status: 400 })
    }
    if (phone && !/^[0-9+\-()\s]{8,20}$/.test(phone)) {
      return NextResponse.json({ error: 'Phone number is invalid.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: authenticated.user.id },
      data: {
        displayName,
        fullName: fullName || null,
        phone: phone || null,
      },
    })

    const response = NextResponse.json({
      data: await profileData(authenticated.user.id),
    })
    if (authenticated.refreshedSession) {
      setSessionCookies(response, authenticated.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to update profile', error)
    return NextResponse.json({ error: 'Unable to update profile.' }, { status: 500 })
  }
}
