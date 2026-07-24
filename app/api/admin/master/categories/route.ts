import { NextRequest, NextResponse } from 'next/server'

import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

import { badRequest, conflict, getMasterListQuery, listMeta, normalizeName, serverError } from '../_utils/masterData'

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
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
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
    console.error('Failed to list camera categories', error)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = normalizeName(body.name)

    if (!name) return badRequest('Category name is required')

    const existing = await prisma.cameraCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    if (existing) return conflict('Category name already exists')

    const category = await prisma.cameraCategory.create({
      data: { name },
    })

    return NextResponse.json({ data: serializeCategory(category) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create camera category', error)
    return serverError()
  }
}
