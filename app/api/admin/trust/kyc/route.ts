import { NextRequest, NextResponse } from 'next/server'
import { VerificationStatus } from '@/lib/generated/prisma/client'
import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import {
  createSupabaseAuthClient,
  setSessionCookies,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = new Set<VerificationStatus>([
  VerificationStatus.pending,
  VerificationStatus.approved,
  VerificationStatus.rejected,
])

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    await prisma.identityVerification.updateMany({
      where: {
        status: VerificationStatus.approved,
        reviewedBy: null,
      },
      data: {
        status: VerificationStatus.pending,
        reviewedAt: null,
      },
    })

    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const statusParam = request.nextUrl.searchParams.get('status')
    const status =
      statusParam && VALID_STATUSES.has(statusParam as VerificationStatus)
        ? (statusParam as VerificationStatus)
        : undefined

    const records = await prisma.identityVerification.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search
          ? {
              user: {
                OR: [
                  { displayName: { contains: search, mode: 'insensitive' } },
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            }
          : {}),
      },
      select: {
        id: true,
        legalName: true,
        documentStoragePath: true,
        status: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        user: {
          select: {
            displayName: true,
            email: true,
            identityVerifications: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    let storage:
      | ReturnType<typeof createSupabaseAuthClient>['storage']
      | null = null
    if (admin.accessToken && admin.refreshToken) {
      const supabase = createSupabaseAuthClient()
      const { error } = await supabase.auth.setSession({
        access_token: admin.accessToken,
        refresh_token: admin.refreshToken,
      })
      if (!error) storage = supabase.storage
    }

    const bucket = process.env.SUPABASE_IDENTITY_BUCKET ?? 'identity-documents'
    const data = await Promise.all(
      records.map(async (record) => {
        const signed = storage
          ? await storage.from(bucket).createSignedUrl(record.documentStoragePath, 300)
          : null
        if (signed?.error) {
          console.error('Failed to create identity-document signed URL', {
            verificationId: record.id.toString(),
            message: signed.error.message,
          })
        }

        return {
          id: record.id.toString(),
          user: {
            displayName: record.user.displayName,
            email: record.user.email,
          },
          legalName: record.legalName,
          documentType: 'national_id' as const,
          documentUrl: signed?.data?.signedUrl ?? null,
          submittedAt: record.createdAt.toISOString(),
          retryCount: Math.max(0, record.user.identityVerifications.length - 1),
          status: record.status,
          rejectionReason: record.rejectionReason,
          reviewedAt: record.reviewedAt?.toISOString() ?? null,
        }
      }),
    )

    const response = NextResponse.json({ data })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load identity verification queue', error)
    return NextResponse.json(
      { error: 'Unable to load identity verification queue.' },
      { status: 500 },
    )
  }
}
