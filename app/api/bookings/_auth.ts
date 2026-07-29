import { cookies } from 'next/headers'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  syncSupabaseUser,
} from '@/lib/auth/server'

export async function getBookingRequestContext() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
  const resolved = await resolveSession(
    accessToken,
    refreshToken,
  )
  if (!resolved) return null

  return {
    user: await syncSupabaseUser(resolved.user),
    authUserId: resolved.user.id,
    accessToken: resolved.session?.access_token ?? accessToken,
    refreshToken: resolved.session?.refresh_token ?? refreshToken,
    refreshedSession: resolved.session,
  }
}
