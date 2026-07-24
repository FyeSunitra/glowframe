import { NextRequest, NextResponse } from 'next/server'

import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

import { badRequest, conflict, getMasterListQuery, listMeta, normalizeName, serverError } from '../_utils/masterData'

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
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
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
    console.error('Failed to list brands', error)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = normalizeName(body.name)

    if (!name) return badRequest('Brand name is required')

    const existing = await prisma.brand.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    if (existing) return conflict('Brand name already exists')

    const brand = await prisma.brand.create({
      data: { name },
    })

    return NextResponse.json({ data: serializeBrand(brand) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create brand', error)
    return serverError()
  }
}
