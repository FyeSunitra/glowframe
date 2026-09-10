import { NextRequest, NextResponse } from 'next/server'

import { getUserRequestContext } from '@/lib/auth/userRequest'
import { prisma } from '@/lib/prisma'

function serializeNotification(notification: {
  id: bigint
  type: string
  title: string
  body: string | null
  linkUrl: string | null
  readAt: Date | null
  createdAt: Date
}) {
  return {
    id: Number(notification.id),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    linkUrl: notification.linkUrl,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  }
}

export async function GET(request: NextRequest) {
  const context = await getUserRequestContext()
  if (!context) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })

  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit')) || 12))
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: context.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, type: true, title: true, body: true, linkUrl: true, readAt: true, createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId: context.user.id, readAt: null } }),
  ])

  return NextResponse.json({ data: { items: items.map(serializeNotification), unreadCount } })
}
