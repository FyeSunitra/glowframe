import { cookies } from 'next/headers'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

export async function getAdminRequestContext() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
  const resolved = await resolveSession(accessToken, refreshToken)
  if (!resolved) return null

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { authUserId: resolved.user.id },
        ...(resolved.user.email
          ? [{ email: resolved.user.email.trim().toLowerCase() }]
          : []),
      ],
      role: 'admin',
      status: 'active',
    },
    select: { id: true },
  })
  if (!user) return null

  return {
    user,
    accessToken: resolved.session?.access_token ?? accessToken,
    refreshToken: resolved.session?.refresh_token ?? refreshToken,
    refreshedSession: resolved.session,
  }
}
