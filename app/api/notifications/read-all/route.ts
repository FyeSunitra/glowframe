import { NextResponse } from 'next/server'

import { getUserRequestContext } from '@/lib/auth/userRequest'
import { prisma } from '@/lib/prisma'

export async function PATCH() {
  const context = await getUserRequestContext()
  if (!context) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })

  const result = await prisma.notification.updateMany({
    where: { userId: context.user.id, readAt: null },
    data: { readAt: new Date() },
  })
  return NextResponse.json({ data: { updated: result.count } })
}
