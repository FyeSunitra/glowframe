import { cookies } from 'next/headers'

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  syncSupabaseUser,
} from '@/lib/auth/server'

export async function getOwnerRequestContext() {
  const cookieStore = await cookies()
  const resolved = await resolveSession(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  )
  if (!resolved) return null

  return {
    user: await syncSupabaseUser(resolved.user),
    refreshedSession: resolved.session,
  }
}
