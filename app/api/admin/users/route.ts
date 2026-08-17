import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { Prisma, UserRole, UserStatus, VerificationStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { adminUserInclude, serializeAdminUser } from './_utils'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const page = positiveInteger(request.nextUrl.searchParams.get('page'), 1)
    const limit = Math.min(
      positiveInteger(request.nextUrl.searchParams.get('limit'), 10),
      50,
    )
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const statusParam = request.nextUrl.searchParams.get('status')
    const status =
      statusParam === UserStatus.active || statusParam === UserStatus.suspended
        ? statusParam
        : undefined
    const verification = request.nextUrl.searchParams.get('verification')
    const approvedIdentity = {
      status: VerificationStatus.approved,
      reviewedBy: { not: null },
    } satisfies Prisma.IdentityVerificationWhereInput

    const where: Prisma.UserWhereInput = {
      role: UserRole.user,
      ...(status ? { status } : {}),
      ...(verification === 'verified'
        ? {
            phone: { not: null },
            emailVerifiedAt: { not: null },
            identityVerifications: { some: approvedIdentity },
          }
        : verification === 'unverified'
          ? {
              OR: [
                { phone: null },
                { emailVerifiedAt: null },
                { identityVerifications: { none: approvedIdentity } },
              ],
            }
          : {}),
      ...(search
        ? {
            OR: [
              { displayName: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: adminUserInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const response = NextResponse.json({
      data: users.map(serializeAdminUser),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load admin users', error)
    return NextResponse.json(
      { error: 'Unable to load users.' },
      { status: 500 },
    )
  }
}

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}
