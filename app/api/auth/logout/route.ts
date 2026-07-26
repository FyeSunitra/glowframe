import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  createSupabaseAuthClient,
} from '@/lib/auth/server'

export async function POST() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  if (accessToken && refreshToken) {
    const supabase = createSupabaseAuthClient()
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    await supabase.auth.signOut({ scope: 'local' })
  }

  const response = NextResponse.json({ data: null })
  clearSessionCookies(response)
  return response
}
