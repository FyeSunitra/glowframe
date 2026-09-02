import { NextRequest, NextResponse } from 'next/server'

import {
  acceptRequiredSignupPolicies,
  clearGoogleOAuthVerifier,
  clearSessionCookies,
  createGoogleOAuthClient,
  setSessionCookies,
  syncSupabaseUser,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get('intent') === 'signup'
    ? 'signup'
    : 'login'
  const code = request.nextUrl.searchParams.get('code')
  const fallbackPath = intent === 'signup' ? '/signup' : '/log-in'
  const response = NextResponse.redirect(new URL(fallbackPath, request.url))

  if (!code) {
    clearGoogleOAuthVerifier(response)
    return response
  }

  try {
    const supabase = createGoogleOAuthClient(request, response)
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    clearGoogleOAuthVerifier(response)
    if (error || !data.user || !data.session || !data.user.email) {
      console.error('Failed to finish Google OAuth', error)
      return response
    }

    const email = data.user.email.trim().toLowerCase()
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ authUserId: data.user.id }, { email }],
      },
      select: { id: true, authUserId: true },
    })

    if (existingUser?.authUserId && existingUser.authUserId !== data.user.id) {
      clearSessionCookies(response)
      return response
    }

    if (!existingUser && intent !== 'signup') {
      clearSessionCookies(response)
      response.headers.set('location', new URL('/signup', request.url).toString())
      return response
    }

    const databaseUser = await syncSupabaseUser(data.user)
    if (!existingUser) {
      await acceptRequiredSignupPolicies(databaseUser.id)
    }
    if (databaseUser.status === 'suspended') {
      clearSessionCookies(response)
      response.headers.set('location', new URL('/home', request.url).toString())
      return response
    }

    setSessionCookies(response, data.session)
    response.headers.set(
      'location',
      new URL(databaseUser.role === 'admin' ? '/admin/dashboard' : '/home', request.url).toString(),
    )
    return response
  } catch (error) {
    console.error('Failed to finish Google OAuth', error)
    clearGoogleOAuthVerifier(response)
    clearSessionCookies(response)
    return response
  }
}
