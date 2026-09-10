import { NextResponse } from 'next/server'

import { getUserRequestContext } from '@/lib/auth/userRequest'
import { prisma } from '@/lib/prisma'

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getUserRequestContext()
  const { id } = await params
  if (!context) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })

  const notification = await prisma.notification.findFirst({
    where: { id: BigInt(id), userId: context.user.id },
  })
  if (!notification) return NextResponse.json({ error: 'Notification not found.' }, { status: 404 })

  const updated = notification.readAt
    ? notification
    : await prisma.notification.update({ where: { id: notification.id }, data: { readAt: new Date() } })

  return NextResponse.json({
    data: {
      id: Number(updated.id), type: updated.type, title: updated.title, body: updated.body,
      linkUrl: updated.linkUrl, readAt: updated.readAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    },
  })
}
