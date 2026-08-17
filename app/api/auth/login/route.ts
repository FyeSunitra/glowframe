import { NextRequest, NextResponse } from 'next/server'
import {
  createSupabaseAuthClient,
  setSessionCookies,
  syncSupabaseUser,
  toAppUser,
} from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      )
    }

    const supabase = createSupabaseAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? 'Invalid email or password.' },
        { status: error?.status ?? 401 },
      )
    }

    if (!data.user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in.' },
        { status: 403 },
      )
    }

    const databaseUser = await syncSupabaseUser(data.user)
    if (databaseUser.status === 'suspended') {
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          error: 'This account has been suspended. Please contact support.',
          code: 'ACCOUNT_SUSPENDED',
        },
        { status: 403 },
      )
    }
    const response = NextResponse.json({
      data: {
        user: await toAppUser(databaseUser.id),
      },
    })
    setSessionCookies(response, data.session)
    return response
  } catch (error) {
    console.error('Login failed', error)
    return NextResponse.json({ error: 'Unable to log in.' }, { status: 500 })
  }
}
