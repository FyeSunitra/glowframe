import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import { getMasterListQuery, listMeta, serverError } from '../../admin/master/_utils/masterData'

function serializeAccessory(accessory: {
  id: bigint
  name: string
  isActive: boolean
  _count?: { products: number }
}) {
  return {
    id: Number(accessory.id),
    name: accessory.name,
    usedInListings: accessory._count?.products ?? 0,
    active: accessory.isActive,
  }
}

export async function GET(req: NextRequest) {
  try {
    const query = getMasterListQuery(req)
    const where = {
      isActive: true,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    }

    const [accessories, total] = await Promise.all([
      prisma.accessory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: query.skip,
        take: query.limit,
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.accessory.count({ where }),
    ])

    return NextResponse.json({ data: accessories.map(serializeAccessory), meta: listMeta(total, query) })
  } catch (error) {
    console.error('Failed to list public accessories', error)
    return serverError()
  }
}
