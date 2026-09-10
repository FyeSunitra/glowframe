import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  setSessionCookies,
} from '@/lib/auth/server'

export async function GET() {
  const cookieStore = await cookies()
  const resolved = await resolveSession(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  )
  if (!resolved) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })

  const accessToken = resolved.session?.access_token ?? cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  if (!accessToken) return NextResponse.json({ error: 'Session token unavailable.' }, { status: 401 })

  const response = NextResponse.json({
    data: {
      accessToken,
      expiresAt: resolved.session?.expires_at
        ? new Date(resolved.session.expires_at * 1000).toISOString()
        : null,
    },
  })
  if (resolved.session) setSessionCookies(response, resolved.session)
  return response
}
