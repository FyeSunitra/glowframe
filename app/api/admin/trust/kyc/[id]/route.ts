import { NextRequest, NextResponse } from 'next/server'
import { VerificationStatus } from '@/lib/generated/prisma/client'
import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { id } = await params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid verification ID.' }, { status: 400 })
    }

    const body = await request.json()
    const action = body?.action
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 })
    }
    if (action === 'reject' && !reason) {
      return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 })
    }

    const result = await prisma.identityVerification.updateMany({
      where: {
        id: BigInt(id),
        status: VerificationStatus.pending,
      },
      data: {
        status:
          action === 'approve'
            ? VerificationStatus.approved
            : VerificationStatus.rejected,
        rejectionReason: action === 'reject' ? reason : null,
        reviewedBy: admin.user.id,
        reviewedAt: new Date(),
      },
    })
    if (result.count === 0) {
      return NextResponse.json(
        { error: 'This verification was already reviewed or does not exist.' },
        { status: 409 },
      )
    }

    const record = await prisma.identityVerification.findUniqueOrThrow({
      where: { id: BigInt(id) },
      select: {
        id: true,
        legalName: true,
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
    })

    const response = NextResponse.json({
      data: {
        id: record.id.toString(),
        user: record.user,
        legalName: record.legalName,
        documentType: 'national_id',
        documentUrl: null,
        submittedAt: record.createdAt.toISOString(),
        retryCount: Math.max(0, record.user.identityVerifications.length - 1),
        status: record.status,
        rejectionReason: record.rejectionReason,
        reviewedAt: record.reviewedAt?.toISOString() ?? null,
      },
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to review identity verification', error)
    return NextResponse.json(
      { error: 'Unable to review identity verification.' },
      { status: 500 },
    )
  }
}
