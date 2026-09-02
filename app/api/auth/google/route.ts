import { NextRequest, NextResponse } from 'next/server'

import { createGoogleOAuthClient } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get('intent') === 'signup'
    ? 'signup'
    : 'login'
  const callbackUrl = new URL('/api/auth/google/callback', request.url)
  callbackUrl.searchParams.set('intent', intent)
  const response = NextResponse.redirect(new URL(intent === 'signup' ? '/signup' : '/log-in', request.url))

  try {
    const supabase = createGoogleOAuthClient(request, response)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    })
    if (error || !data.url) {
      console.error('Failed to start Google OAuth', error)
      return NextResponse.redirect(new URL(intent === 'signup' ? '/signup' : '/log-in', request.url))
    }

    response.headers.set('location', data.url)
    return response
  } catch (error) {
    console.error('Failed to start Google OAuth', error)
    return NextResponse.redirect(new URL(intent === 'signup' ? '/signup' : '/log-in', request.url))
  }
}
