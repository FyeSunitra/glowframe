import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  createSupabaseAuthClient,
  resolveSession,
  setSessionCookies,
} from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const resolved = await resolveSession(
      cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
      cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
    )
    if (!resolved?.user.email) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const body = await request.json()
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new passwords are required.' },
        { status: 400 },
      )
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 },
      )
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from the current password.' },
        { status: 400 },
      )
    }

    const supabase = createSupabaseAuthClient()
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: resolved.user.email,
        password: currentPassword,
      })

    if (signInError || !signInData.session) {
      return NextResponse.json(
        { error: 'Current password is incorrect.', code: 'invalid_current_password' },
        { status: 400 },
      )
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (updateError) {
      return NextResponse.json(
        { error: updateError.message, code: updateError.code },
        { status: updateError.status ?? 400 },
      )
    }

    const response = NextResponse.json({ data: null })
    setSessionCookies(response, signInData.session)
    return response
  } catch (error) {
    console.error('Failed to change password', error)
    return NextResponse.json({ error: 'Unable to change password.' }, { status: 500 })
  }
}
