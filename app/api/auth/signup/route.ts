import { NextRequest, NextResponse } from 'next/server'
import {
  acceptRequiredSignupPolicies,
  createSupabaseAuthClient,
  setSessionCookies,
  syncSupabaseUser,
  toAppUser,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

const EMAIL_EXISTS_ERROR = {
  error: 'An account with this email already exists.',
  code: 'email_already_registered',
}

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

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existingUser) {
      return NextResponse.json(EMAIL_EXISTS_ERROR, { status: 409 })
    }

    const supabase = createSupabaseAuthClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: email.split('@')[0],
        },
      },
    })

    if (error) {
      console.error('Supabase signup rejected the request', {
        name: error.name,
        code: error.code,
        status: error.status,
        message: error.message,
      })

      const upstreamFailed = Boolean(error.status && error.status >= 500)
      return NextResponse.json(
        {
          error: upstreamFailed
            ? 'Supabase Auth could not send the confirmation email. Check Auth logs and SMTP settings.'
            : error.message,
          code: error.code ?? (upstreamFailed ? 'auth_email_delivery_failed' : 'auth_signup_failed'),
        },
        { status: upstreamFailed ? 502 : (error.status ?? 400) },
      )
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Unable to create account.' }, { status: 400 })
    }

    if (data.user.identities?.length === 0) {
      return NextResponse.json(EMAIL_EXISTS_ERROR, { status: 409 })
    }

    const databaseUser = await syncSupabaseUser(data.user)

    if (!data.session) {
      return NextResponse.json({
        data: {
          user: null,
          requiresVerification: true,
        },
      })
    }

    await acceptRequiredSignupPolicies(databaseUser.id)
    const response = NextResponse.json({
      data: {
        user: await toAppUser(databaseUser.id),
        requiresVerification: false,
      },
    })
    setSessionCookies(response, data.session)
    return response
  } catch (error) {
    console.error('Signup failed', error)
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 })
  }
}
