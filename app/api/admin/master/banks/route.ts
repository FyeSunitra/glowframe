import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import {
  badRequest,
  conflict,
  getMasterListQuery,
  listMeta,
  normalizeName,
  normalizeOptionalString,
  serverError,
} from '../_utils/masterData'

function serializeBank(bank: {
  id: bigint
  code: string
  abbreviation: string
  name: string
  logoUrl: string | null
  isActive: boolean
  _count?: { bankAccounts: number }
}) {
  return {
    id: Number(bank.id),
    code: bank.code,
    abbreviation: bank.abbreviation,
    name: bank.name,
    logoUrl: bank.logoUrl,
    usedInAccounts: bank._count?.bankAccounts ?? 0,
    active: bank.isActive,
  }
}

export async function GET(req: NextRequest) {
  try {
    const query = getMasterListQuery(req)
    const where = {
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' as const } },
              { abbreviation: { contains: query.search, mode: 'insensitive' as const } },
              { name: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
    }

    const [banks, total] = await Promise.all([
      prisma.bank.findMany({
        where,
        orderBy: [{ abbreviation: 'asc' }, { name: 'asc' }],
        skip: query.skip,
        take: query.limit,
        include: {
          _count: {
            select: { bankAccounts: true },
          },
        },
      }),
      prisma.bank.count({ where }),
    ])

    return NextResponse.json({ data: banks.map(serializeBank), meta: listMeta(total, query) })
  } catch (error) {
    console.error('Failed to list banks', error)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = normalizeName(body.code).toUpperCase()
    const abbreviation = normalizeName(body.abbreviation).toUpperCase()
    const name = normalizeName(body.name)
    const logoUrl = normalizeOptionalString(body.logoUrl)

    if (!code) return badRequest('Bank code is required')
    if (!abbreviation) return badRequest('Bank abbreviation is required')
    if (!name) return badRequest('Bank name is required')

    const existing = await prisma.bank.findFirst({
      where: {
        OR: [
          { code: { equals: code, mode: 'insensitive' } },
          { abbreviation: { equals: abbreviation, mode: 'insensitive' } },
        ],
      },
    })

    if (existing) return conflict('Bank code or abbreviation already exists')

    const bank = await prisma.bank.create({
      data: { code, abbreviation, name, logoUrl },
    })

    return NextResponse.json({ data: serializeBank(bank) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create bank', error)
    return serverError()
  }
}
