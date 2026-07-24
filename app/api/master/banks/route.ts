import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import { getMasterListQuery, listMeta, serverError } from '../../admin/master/_utils/masterData'

function serializeBank(bank: {
  id: bigint
  code: string
  abbreviation: string
  name: string
  logoUrl: string | null
  isActive: boolean
}) {
  return {
    id: Number(bank.id),
    code: bank.code,
    abbreviation: bank.abbreviation,
    name: bank.name,
    logoUrl: bank.logoUrl,
    usedInAccounts: 0,
    active: bank.isActive,
  }
}

export async function GET(req: NextRequest) {
  try {
    const query = getMasterListQuery(req)
    const where = {
      isActive: true,
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' as const } },
              { abbreviation: { contains: query.search, mode: 'insensitive' as const } },
              { name: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [banks, total] = await Promise.all([
      prisma.bank.findMany({
        where,
        orderBy: [{ abbreviation: 'asc' }, { name: 'asc' }],
        skip: query.skip,
        take: query.limit,
      }),
      prisma.bank.count({ where }),
    ])

    return NextResponse.json({ data: banks.map(serializeBank), meta: listMeta(total, query) })
  } catch (error) {
    console.error('Failed to list public banks', error)
    return serverError()
  }
}
