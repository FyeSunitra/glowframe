import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import type { MasterListQuery } from '@/types/masterData'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export function parseBigIntId(id: string) {
  if (!/^\d+$/.test(id)) return null
  return BigInt(id)
}

export function normalizeName(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeOptionalString(value: unknown) {
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getActiveInput(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

export function getMasterListQuery(req: NextRequest): MasterListQuery {
  const params = req.nextUrl.searchParams
  const pageValue = Number(params.get('page') ?? DEFAULT_PAGE)
  const limitValue = Number(params.get('limit') ?? DEFAULT_LIMIT)
  const activeValue = params.get('is_active') ?? params.get('active')
  const search = normalizeOptionalString(params.get('search')) ?? undefined

  const page = Number.isFinite(pageValue) && pageValue > 0 ? Math.floor(pageValue) : DEFAULT_PAGE
  const limit =
    Number.isFinite(limitValue) && limitValue > 0
      ? Math.min(Math.floor(limitValue), MAX_LIMIT)
      : DEFAULT_LIMIT

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    search,
    isActive: activeValue === null ? undefined : activeValue === 'true',
  }
}

export function listMeta(total: number, query: MasterListQuery) {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  }
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function notFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

export function serverError() {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
