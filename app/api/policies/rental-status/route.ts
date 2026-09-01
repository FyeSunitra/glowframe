import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  setSessionCookies,
  syncSupabaseUser,
} from '@/lib/auth/server'
import { PolicyDocumentStatus, PolicyDocumentType } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
          type: PolicyDocumentType.rentalAgreement,
          status: PolicyDocumentStatus.current,
        },
        orderBy: { publishedAt: 'desc' },
        select: { id: true },
      }),
    ])
    const acceptance = policy
      ? await prisma.userPolicyAcceptance.findUnique({
          where: {
            userId_policyDocumentId: {
              userId: user.id,
              policyDocumentId: policy.id,
            },
          },
          select: { id: true },
        })
      : null

    const response = NextResponse.json({ data: { accepted: Boolean(acceptance) } })
    if (resolved.session) setSessionCookies(response, resolved.session)
    return response
  } catch (error) {
    console.error('Failed to check rental agreement acceptance', error)
    return NextResponse.json({ error: 'Unable to check rental agreement acceptance.' }, { status: 500 })
  }
}
