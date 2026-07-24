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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const categoryId = parseBigIntId(id)
    if (!categoryId) return badRequest('Invalid category id')

    const category = await prisma.cameraCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            products: { where: { status: ProductStatus.approved } },
          },
        },
      },
    })

    if (!category) return notFound()

    return NextResponse.json({ data: serializeCategory(category) })
  } catch (error) {
    console.error('Failed to get camera category', error)
    return serverError()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const categoryId = parseBigIntId(id)
    if (!categoryId) return badRequest('Invalid category id')

    const body = await req.json()
    const data: { name?: string; isActive?: boolean } = {}
    const active = getActiveInput(body.active)
    const name = body.name === undefined ? undefined : normalizeName(body.name)

    if (body.name !== undefined) {
      if (!name) return badRequest('Category name is required')

      const existing = await prisma.cameraCategory.findFirst({
        where: {
          id: { not: categoryId },
          name: { equals: name, mode: 'insensitive' },
        },
      })

      if (existing) return conflict('Category name already exists')

      data.name = name
    }

    if (active !== undefined) data.isActive = active
    if (Object.keys(data).length === 0) return badRequest('No valid fields to update')

    const category = await prisma.cameraCategory.update({
      where: { id: categoryId },
      data,
      include: {
        _count: {
          select: {
            products: { where: { status: ProductStatus.approved } },
          },
        },
      },
    })

    return NextResponse.json({ data: serializeCategory(category) })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return notFound()
    }

    console.error('Failed to update camera category', error)
    return serverError()
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const categoryId = parseBigIntId(id)
    if (!categoryId) return badRequest('Invalid category id')

    const category = await prisma.cameraCategory.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true } } },
    })

    if (!category) return notFound()
    if (category._count.products > 0) {
      return NextResponse.json({ error: 'Cannot delete category with listings' }, { status: 400 })
    }

    await prisma.cameraCategory.delete({ where: { id: categoryId } })
    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('Failed to delete camera category', error)
    return serverError()
  }
}
