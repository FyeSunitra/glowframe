import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  resolveSession,
  setSessionCookies,
  syncSupabaseUser,
  toAppUser,
} from '@/lib/auth/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const resolved = await resolveSession(
      cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
      cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
    )

    if (!resolved) {
      const response = NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
      clearSessionCookies(response)
      return response
    }

    const databaseUser = await syncSupabaseUser(resolved.user)
    const response = NextResponse.json({
      data: {
        user: await toAppUser(databaseUser.id),
      },
    })
    if (resolved.session) setSessionCookies(response, resolved.session)
    return response
  } catch (error) {
    console.error('Session lookup failed', error)
    return NextResponse.json({ error: 'Unable to load session.' }, { status: 500 })
  }
}
