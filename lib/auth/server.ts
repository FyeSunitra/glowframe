import { createClient, type Session, type User as SupabaseUser } from '@supabase/supabase-js'
import type { NextResponse } from 'next/server'
import { PolicyDocumentStatus, PolicyDocumentType, VerificationStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import type { User } from '@/types'

export const ACCESS_TOKEN_COOKIE = 'gf-access-token'
export const REFRESH_TOKEN_COOKIE = 'gf-refresh-token'

function authConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error('Supabase Auth environment variables are not configured.')
  }

  return { url, key }
}

export function createSupabaseAuthClient() {
  const { url, key } = authConfig()
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

export function setSessionCookies(response: NextResponse, session: Session) {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.access_token, {
    ...common,
    maxAge: session.expires_in,
  })
  response.cookies.set(REFRESH_TOKEN_COOKIE, session.refresh_token, {
    ...common,
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', { path: '/', maxAge: 0 })
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', { path: '/', maxAge: 0 })
}

export async function syncSupabaseUser(authUser: SupabaseUser) {
  if (!authUser.email) throw new Error('Supabase user does not have an email address.')

  const email = authUser.email.trim().toLowerCase()
  const displayName =
    typeof authUser.user_metadata?.display_name === 'string' &&
    authUser.user_metadata.display_name.trim()
      ? authUser.user_metadata.display_name.trim()
      : email.split('@')[0]
  const emailVerifiedAt = authUser.email_confirmed_at
    ? new Date(authUser.email_confirmed_at)
    : null

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ authUserId: authUser.id }, { email }],
    },
    select: { id: true },
  })

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        authUserId: authUser.id,
        email,
        emailVerifiedAt,
      },
    })
  }

  return prisma.user.create({
    data: {
      authUserId: authUser.id,
      email,
      displayName,
      emailVerifiedAt,
    },
  })
}

export async function acceptRequiredSignupPolicies(userId: bigint) {
  const requiredTypes = [
    PolicyDocumentType.termsOfService,
    PolicyDocumentType.privacyPolicy,
    PolicyDocumentType.rentalAgreement,
  ]
  const policies = await prisma.policyDocument.findMany({
    where: {
      type: { in: requiredTypes },
      status: PolicyDocumentStatus.current,
      isRequired: true,
    },
    orderBy: { publishedAt: 'desc' },
  })

  const latestPolicies = [...new Map(policies.map((policy) => [policy.type, policy])).values()]
  if (!latestPolicies.length) return

  await prisma.userPolicyAcceptance.createMany({
    data: latestPolicies.map((policy) => ({
      userId,
      policyDocumentId: policy.id,
      acceptedVersion: policy.version,
    })),
    skipDuplicates: true,
  })
}

export async function toAppUser(userId: bigint): Promise<User> {
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
    profileImageUrl: user.profileImageUrl ?? undefined,
    role: user.role,
    phoneVerified: Boolean(user.phone),
    emailVerified: Boolean(user.emailVerifiedAt),
    idVerified: user.identityVerifications.length > 0,
    suspended: user.status === 'suspended',
  }
}

export async function resolveSession(accessToken?: string, refreshToken?: string) {
  const supabase = createSupabaseAuthClient()

  if (accessToken) {
    const { data } = await supabase.auth.getUser(accessToken)
    if (data.user) return { user: data.user, session: null }
  }

  if (!refreshToken) return null

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })
  if (error || !data.user || !data.session) return null

  return { user: data.user, session: data.session }
}
