import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { UserRole, UserStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { adminUserInclude, serializeAdminUser } from '../_utils'

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
      return NextResponse.json({ error: 'User id is invalid.' }, { status: 400 })
    }
    const body = await request.json()
    const status =
      body?.action === 'suspend'
        ? UserStatus.suspended
        : body?.action === 'unsuspend'
          ? UserStatus.active
          : null
    if (!status) {
      return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 })
    }

    const userId = BigInt(id)
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (!existing || existing.role !== UserRole.user) {
      return NextResponse.json({ error: 'User was not found.' }, { status: 404 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
      include: adminUserInclude,
    })
    const response = NextResponse.json({ data: serializeAdminUser(user) })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to update admin user', error)
    return NextResponse.json(
      { error: 'Unable to update the user account.' },
      { status: 500 },
    )
  }
}
