import 'server-only'

import { randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

const COOKIE_NAME = 'gf-photobooth-session'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function getPhotoboothSessionId() {
  const value = (await cookies()).get(COOKIE_NAME)?.value
  return value && UUID_PATTERN.test(value) ? value : null
}

export async function ensurePhotoboothSession() {
  const existing = await getPhotoboothSessionId()
  return existing ? { id: existing, isNew: false } : { id: randomUUID(), isNew: true }
}

export function setPhotoboothSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}
