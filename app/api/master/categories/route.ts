import { NextRequest, NextResponse } from 'next/server'

import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

import { getMasterListQuery, listMeta, serverError } from '../../admin/master/_utils/masterData'

function serializeCategory(category: {
  id: bigint
  name: string
  isActive: boolean
  _count?: { products: number }
}) {
  return {
    id: Number(category.id),
    name: category.name,
    activeListings: category._count?.products ?? 0,
    active: category.isActive,
  }
}

export async function GET(req: NextRequest) {
  try {
    const query = getMasterListQuery(req)
    const where = {
      isActive: true,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    }

    const [categories, total] = await Promise.all([
      prisma.cameraCategory.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: query.skip,
        take: query.limit,
        include: {
          _count: {
            select: {
              products: { where: { status: ProductStatus.approved } },
            },
          },
        },
      }),
      prisma.cameraCategory.count({ where }),
    ])

    return NextResponse.json({ data: categories.map(serializeCategory), meta: listMeta(total, query) })
  } catch (error) {
    console.error('Failed to list public camera categories', error)
    return serverError()
  }
}
