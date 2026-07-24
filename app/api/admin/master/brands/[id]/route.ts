import { NextRequest, NextResponse } from 'next/server'

import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

import {
  badRequest,
  conflict,
  getActiveInput,
  normalizeName,
  notFound,
  parseBigIntId,
  serverError,
} from '../../_utils/masterData'

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const brandId = parseBigIntId(id)
    if (!brandId) return badRequest('Invalid brand id')

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        _count: {
          select: {
            products: { where: { status: ProductStatus.approved } },
          },
        },
      },
    })

    if (!brand) return notFound()

    return NextResponse.json({ data: serializeBrand(brand) })
  } catch (error) {
    console.error('Failed to get brand', error)
    return serverError()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const brandId = parseBigIntId(id)
    if (!brandId) return badRequest('Invalid brand id')

    const body = await req.json()
    const data: { name?: string; isActive?: boolean } = {}
    const active = getActiveInput(body.active)
    const name = body.name === undefined ? undefined : normalizeName(body.name)

    if (body.name !== undefined) {
      if (!name) return badRequest('Brand name is required')

      const existing = await prisma.brand.findFirst({
        where: {
          id: { not: brandId },
          name: { equals: name, mode: 'insensitive' },
        },
      })

      if (existing) return conflict('Brand name already exists')

      data.name = name
    }

    if (active !== undefined) data.isActive = active
    if (Object.keys(data).length === 0) return badRequest('No valid fields to update')

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data,
      include: {
        _count: {
          select: {
            products: { where: { status: ProductStatus.approved } },
          },
        },
      },
    })

    return NextResponse.json({ data: serializeBrand(brand) })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return notFound()
    }

    console.error('Failed to update brand', error)
    return serverError()
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const brandId = parseBigIntId(id)
    if (!brandId) return badRequest('Invalid brand id')

    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { _count: { select: { products: true } } },
    })

    if (!brand) return notFound()
    if (brand._count.products > 0) {
      return NextResponse.json({ error: 'Cannot delete brand with listings' }, { status: 400 })
    }

    await prisma.brand.delete({ where: { id: brandId } })
    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('Failed to delete brand', error)
    return serverError()
  }
}
