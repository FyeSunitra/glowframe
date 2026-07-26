import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAuthClient } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const supabase = createSupabaseAuthClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      console.error('Supabase OTP resend rejected the request', {
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
          code: error.code ?? (upstreamFailed ? 'auth_email_delivery_failed' : 'auth_resend_failed'),
        },
        { status: upstreamFailed ? 502 : (error.status ?? 400) },
      )
    }

    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('OTP resend failed', error)
    return NextResponse.json({ error: 'Unable to resend OTP.' }, { status: 500 })
  }
}
