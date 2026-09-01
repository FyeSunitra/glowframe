import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  setSessionCookies,
  syncSupabaseUser,
} from '@/lib/auth/server'
import { PolicyDocumentStatus, PolicyDocumentType } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const policyDocumentId = Number(body.policyDocumentId)
    if (!Number.isSafeInteger(policyDocumentId) || policyDocumentId <= 0) {
      return NextResponse.json({ error: 'Invalid policy document.' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const resolved = await resolveSession(
      cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
      cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
    )
    if (!resolved) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const [user, policy] = await Promise.all([
      syncSupabaseUser(resolved.user),
      prisma.policyDocument.findFirst({
        where: {
          id: BigInt(policyDocumentId),
          type: {
            in: [PolicyDocumentType.listingPolicy, PolicyDocumentType.rentalAgreement],
          },
          status: PolicyDocumentStatus.current,
        },
        select: { id: true, version: true },
      }),
    ])
    if (!policy) {
      return NextResponse.json({ error: 'The current policy is unavailable.' }, { status: 404 })
    }

    await prisma.userPolicyAcceptance.createMany({
      data: [{
        userId: user.id,
        policyDocumentId: policy.id,
        acceptedVersion: policy.version,
        ipAddress: requestIp(req),
        userAgent: req.headers.get('user-agent')?.slice(0, 2_000) || null,
      }],
      skipDuplicates: true,
    })

    const response = NextResponse.json({ data: { policyDocumentId } })
    if (resolved.session) setSessionCookies(response, resolved.session)
    return response
  } catch (error) {
    console.error('Failed to accept policy', error)
    return NextResponse.json({ error: 'Unable to accept the policy.' }, { status: 500 })
  }
}

function requestIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null
}
