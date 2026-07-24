import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import { badRequest, conflict, getMasterListQuery, listMeta, normalizeName, serverError } from '../_utils/masterData'

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
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(query.isActive === undefined ? {} : { isActive: query.isActive }),
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
    console.error('Failed to list accessories', error)
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = normalizeName(body.name)

    if (!name) return badRequest('Accessory name is required')

    const existing = await prisma.accessory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    if (existing) return conflict('Accessory name already exists')

    const accessory = await prisma.accessory.create({
      data: { name },
    })

    return NextResponse.json({ data: serializeAccessory(accessory) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create accessory', error)
    return serverError()
  }
}
