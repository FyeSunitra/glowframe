import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { adminProductInclude, serializeAdminProduct } from './_utils'

const STATUS_FILTERS: Record<string, ProductStatus> = {
  pending: ProductStatus.pending,
  active: ProductStatus.approved,
  rejected: ProductStatus.rejected,
  hidden: ProductStatus.hidden,
  archived: ProductStatus.archived,
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const status = request.nextUrl.searchParams.get('status') ?? ''
    const price = request.nextUrl.searchParams.get('price') ?? ''
    const statusFilter = STATUS_FILTERS[status]

    const products = await prisma.product.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                {
                  owner: {
                    OR: [
                      { displayName: { contains: search, mode: 'insensitive' } },
                      { email: { contains: search, mode: 'insensitive' } },
                    ],
                  },
                },
              ],
            }
          : {}),
        ...(price === 'under500'
          ? { pricePerDay: { lt: 500 } }
          : price === '500-1500'
            ? { pricePerDay: { gte: 500, lte: 1500 } }
            : price === 'above1500'
              ? { pricePerDay: { gt: 1500 } }
              : {}),
      },
      include: adminProductInclude,
      orderBy: { createdAt: 'desc' },
    })

    const response = NextResponse.json({
      data: products.map(serializeAdminProduct),
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load admin products', error)
    return NextResponse.json({ error: 'Unable to load product listings.' }, { status: 500 })
  }
}
