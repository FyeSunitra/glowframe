import { NextRequest, NextResponse } from 'next/server'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  resolveSession,
  setSessionCookies,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

export async function proxy(request: NextRequest) {
  const isApiRequest = request.nextUrl.pathname.startsWith('/api/')
  const isAdminRequest =
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/api/admin')
  const resolved = await resolveSession(
    request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
    request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
  )

  if (!resolved) {
    if (isApiRequest) {
      const response = NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
      clearSessionCookies(response)
      return response
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    const response = NextResponse.redirect(loginUrl)
    clearSessionCookies(response)
    return response
  }

  if (isAdminRequest) {
    const databaseUser = await prisma.user.findFirst({
      where: {
        OR: [
          { authUserId: resolved.user.id },
          ...(resolved.user.email
            ? [{ email: resolved.user.email.trim().toLowerCase() }]
            : []),
        ],
      },
      select: {
        role: true,
        status: true,
      },
    })

    if (!databaseUser || databaseUser.role !== 'admin' || databaseUser.status !== 'active') {
      if (isApiRequest) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  const response = NextResponse.next()
  if (resolved.session) setSessionCookies(response, resolved.session)
  return response
}

export const config = {
  matcher: [
    '/about/:path*',
    '/home/:path*',
    '/for-rent/:path*',
    '/account/:path*',
    '/wallet/:path*',
    '/list-camera/:path*',
    '/transaction/:path*',
    '/booking-confirmed/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/user/:path*',
    '/api/bookings/:path*',
    '/api/wallet/:path*',
  ],
}
