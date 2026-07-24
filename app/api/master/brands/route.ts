import { NextRequest, NextResponse } from 'next/server'

import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

import { getMasterListQuery, listMeta, serverError } from '../../admin/master/_utils/masterData'

function serializeBrand(brand: {
  id: bigint
  name: string
  isActive: boolean
  _count?: { products: number }
}) {
  return {
    id: Number(brand.id),
    name: brand.name,
    activeListings: brand._count?.products ?? 0,
    active: brand.isActive,
  }
}

export async function GET(req: NextRequest) {
  try {
    const query = getMasterListQuery(req)
    const where = {
      isActive: true,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
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
      prisma.brand.count({ where }),
    ])

    return NextResponse.json({ data: brands.map(serializeBrand), meta: listMeta(total, query) })
  } catch (error) {
    console.error('Failed to list public brands', error)
    return serverError()
  }
}
