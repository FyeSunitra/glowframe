import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

import {
  badRequest,
  conflict,
  getActiveInput,
  normalizeName,
  normalizeOptionalString,
  notFound,
  parseBigIntId,
  serverError,
} from '../../_utils/masterData'

function serializeBank(bank: {
  id: bigint
  code: string
  abbreviation: string
  name: string
  logoUrl: string | null
  isActive: boolean
  _count?: { bankAccounts: number }
}) {
  return {
    id: Number(bank.id),
    code: bank.code,
    abbreviation: bank.abbreviation,
    name: bank.name,
    logoUrl: bank.logoUrl,
    usedInAccounts: bank._count?.bankAccounts ?? 0,
    active: bank.isActive,
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bankId = parseBigIntId(id)
    if (!bankId) return badRequest('Invalid bank id')

    const bank = await prisma.bank.findUnique({
      where: { id: bankId },
      include: {
        _count: {
          select: { bankAccounts: true },
        },
      },
    })

    if (!bank) return notFound()

    return NextResponse.json({ data: serializeBank(bank) })
  } catch (error) {
    console.error('Failed to get bank', error)
    return serverError()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bankId = parseBigIntId(id)
    if (!bankId) return badRequest('Invalid bank id')

    const body = await req.json()
    const data: {
      code?: string
      abbreviation?: string
      name?: string
      logoUrl?: string | null
      isActive?: boolean
    } = {}
    const active = getActiveInput(body.active)

    if (body.code !== undefined) {
      const code = normalizeName(body.code).toUpperCase()
      if (!code) return badRequest('Bank code is required')
      data.code = code
    }

    if (body.abbreviation !== undefined) {
      const abbreviation = normalizeName(body.abbreviation).toUpperCase()
      if (!abbreviation) return badRequest('Bank abbreviation is required')
      data.abbreviation = abbreviation
    }

    if (body.name !== undefined) {
      const name = normalizeName(body.name)
      if (!name) return badRequest('Bank name is required')
      data.name = name
    }

    if (body.logoUrl !== undefined) {
      data.logoUrl = normalizeOptionalString(body.logoUrl)
    }

    if (active !== undefined) data.isActive = active
    if (Object.keys(data).length === 0) return badRequest('No valid fields to update')

    if (data.code || data.abbreviation) {
      const existing = await prisma.bank.findFirst({
        where: {
          id: { not: bankId },
          OR: [
            ...(data.code ? [{ code: { equals: data.code, mode: 'insensitive' as const } }] : []),
            ...(data.abbreviation
              ? [{ abbreviation: { equals: data.abbreviation, mode: 'insensitive' as const } }]
              : []),
          ],
        },
      })

      if (existing) return conflict('Bank code or abbreviation already exists')
    }

    const bank = await prisma.bank.update({
      where: { id: bankId },
      data,
      include: {
        _count: {
          select: { bankAccounts: true },
        },
      },
    })

    return NextResponse.json({ data: serializeBank(bank) })
  } catch (error: unknown) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') {
      return notFound()
    }

    console.error('Failed to update bank', error)
    return serverError()
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const bankId = parseBigIntId(id)
    if (!bankId) return badRequest('Invalid bank id')

    const bank = await prisma.bank.findUnique({
      where: { id: bankId },
      include: { _count: { select: { bankAccounts: true } } },
    })

    if (!bank) return notFound()
    if (bank._count.bankAccounts > 0) {
      return NextResponse.json({ error: 'Cannot delete bank used by bank accounts' }, { status: 400 })
    }

    await prisma.bank.delete({ where: { id: bankId } })
    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('Failed to delete bank', error)
    return serverError()
  }
}
