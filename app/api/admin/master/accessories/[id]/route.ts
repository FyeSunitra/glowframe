import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accessoryId = parseBigIntId(id)
    if (!accessoryId) return badRequest('Invalid accessory id')

    const accessory = await prisma.accessory.findUnique({
      where: { id: accessoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!accessory) return notFound()

    return NextResponse.json({ data: serializeAccessory(accessory) })
  } catch (error) {
    console.error('Failed to get accessory', error)
    return serverError()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accessoryId = parseBigIntId(id)
    if (!accessoryId) return badRequest('Invalid accessory id')

    const body = await req.json()
    const data: { name?: string; isActive?: boolean } = {}
    const active = getActiveInput(body.active)
    const name = body.name === undefined ? undefined : normalizeName(body.name)

    if (body.name !== undefined) {
      if (!name) return badRequest('Accessory name is required')

      const existing = await prisma.accessory.findFirst({
        where: {
          id: { not: accessoryId },
          name: { equals: name, mode: 'insensitive' },
        },
      })

      if (existing) return conflict('Accessory name already exists')

      data.name = name
    }

    if (active !== undefined) data.isActive = active
    if (Object.keys(data).length === 0) return badRequest('No valid fields to update')

    const accessory = await prisma.accessory.update({
      where: { id: accessoryId },
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json({ data: serializeAccessory(accessory) })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return notFound()
    }

    console.error('Failed to update accessory', error)
    return serverError()
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const accessoryId = parseBigIntId(id)
    if (!accessoryId) return badRequest('Invalid accessory id')

    const accessory = await prisma.accessory.findUnique({
      where: { id: accessoryId },
      include: { _count: { select: { products: true } } },
    })

    if (!accessory) return notFound()
    if (accessory._count.products > 0) {
      return NextResponse.json({ error: 'Cannot delete accessory used in listings' }, { status: 400 })
    }

    await prisma.accessory.delete({ where: { id: accessoryId } })
    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('Failed to delete accessory', error)
    return serverError()
  }
}
