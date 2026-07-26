import { NextRequest, NextResponse } from 'next/server'
import {
  acceptRequiredSignupPolicies,
  createSupabaseAuthClient,
  setSessionCookies,
  syncSupabaseUser,
  toAppUser,
} from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const token = typeof body.token === 'string' ? body.token.trim() : ''

    if (!email || !/^\d{8}$/.test(token)) {
      return NextResponse.json(
        { error: 'A valid email and 8-digit OTP are required.' },
        { status: 400 },
      )
    }

    const supabase = createSupabaseAuthClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? 'OTP verification failed.' },
        { status: error?.status ?? 400 },
      )
    }

    const databaseUser = await syncSupabaseUser(data.user)
    await acceptRequiredSignupPolicies(databaseUser.id)
    const response = NextResponse.json({
      data: {
        user: await toAppUser(databaseUser.id),
      },
    })
    setSessionCookies(response, data.session)
    return response
  } catch (error) {
    console.error('OTP verification failed', error)
    return NextResponse.json({ error: 'OTP verification failed.' }, { status: 500 })
  }
}
