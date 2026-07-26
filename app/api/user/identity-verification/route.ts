import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { VerificationStatus } from '@/lib/generated/prisma/client'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  createSupabaseAuthClient,
  resolveSession,
  setSessionCookies,
  syncSupabaseUser,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

function verificationData(
  verification: {
    status: VerificationStatus
    createdAt: Date
    rejectionReason: string | null
  } | null,
) {
  return {
    status: verification?.status ?? 'not_submitted',
    verified: verification?.status === VerificationStatus.approved,
    submittedAt: verification?.createdAt.toISOString() ?? null,
    rejectionReason: verification?.rejectionReason ?? null,
  }
}

async function authenticatedUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
  const resolved = await resolveSession(accessToken, refreshToken)
  if (!resolved) return null

  const user = await syncSupabaseUser(resolved.user)
  return {
    user,
    authUser: resolved.user,
    accessToken: resolved.session?.access_token ?? accessToken,
    refreshToken: resolved.session?.refresh_token ?? refreshToken,
    refreshedSession: resolved.session,
  }
}

export async function GET() {
  try {
    const authenticated = await authenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    await prisma.identityVerification.updateMany({
      where: {
        userId: authenticated.user.id,
        status: VerificationStatus.approved,
        reviewedBy: null,
      },
      data: {
        status: VerificationStatus.pending,
        reviewedAt: null,
      },
    })

    const verification = await prisma.identityVerification.findFirst({
      where: { userId: authenticated.user.id },
      select: { status: true, createdAt: true, rejectionReason: true },
      orderBy: { createdAt: 'desc' },
    })

    const response = NextResponse.json({ data: verificationData(verification) })
    if (authenticated.refreshedSession) {
      setSessionCookies(response, authenticated.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load identity verification', error)
    return NextResponse.json(
      { error: 'Unable to load identity verification.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await authenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const current = await prisma.identityVerification.findFirst({
      where: { userId: authenticated.user.id },
      select: { status: true, createdAt: true, rejectionReason: true },
      orderBy: { createdAt: 'desc' },
    })
    if (
      current?.status === VerificationStatus.approved ||
      current?.status === VerificationStatus.pending
    ) {
      return NextResponse.json({ data: verificationData(current) })
    }

    const formData = await request.formData()
    const document = formData.get('document')
    if (!(document instanceof File)) {
      return NextResponse.json({ error: 'An ID card image is required.' }, { status: 400 })
    }

    const extension = ALLOWED_TYPES.get(document.type)
    if (!extension) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, and WEBP images are supported.' },
        { status: 400 },
      )
    }
    if (document.size === 0 || document.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'The image must be no larger than 5 MB.' },
        { status: 400 },
      )
    }
    if (!authenticated.accessToken || !authenticated.refreshToken) {
      return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 })
    }

    const supabase = createSupabaseAuthClient()
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: authenticated.accessToken,
      refresh_token: authenticated.refreshToken,
    })
    if (sessionError) {
      return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 })
    }

    const bucket = process.env.SUPABASE_IDENTITY_BUCKET ?? 'identity-documents'
    const storagePath = `${authenticated.authUser.id}/${randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, await document.arrayBuffer(), {
        contentType: document.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Failed to upload identity document', uploadError)
      return NextResponse.json(
        { error: 'Private identity storage is not configured or the upload was denied.' },
        { status: 502 },
      )
    }

    const verification = await prisma.identityVerification.create({
      data: {
        userId: authenticated.user.id,
        legalName:
          authenticated.user.fullName?.trim() ||
          authenticated.user.displayName.trim() ||
          authenticated.user.email,
        documentStoragePath: storagePath,
        status: VerificationStatus.pending,
      },
      select: { status: true, createdAt: true, rejectionReason: true },
    })

    const response = NextResponse.json(
      { data: verificationData(verification) },
      { status: 201 },
    )
    if (authenticated.refreshedSession) {
      setSessionCookies(response, authenticated.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to submit identity verification', error)
    return NextResponse.json(
      { error: 'Unable to submit identity verification.' },
      { status: 500 },
    )
  }
}
