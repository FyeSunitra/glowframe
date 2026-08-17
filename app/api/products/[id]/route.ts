import { NextRequest, NextResponse } from 'next/server'

import { ProductStatus } from '@/lib/generated/prisma/client'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { publicProductInclude, serializeProduct } from '../_utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  }

  try {
    let currentUserId: bigint | null = null
    try {
      const cookieStore = await cookies()
      const resolved = await resolveSession(
        cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
        cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
      )
      if (resolved) {
        const currentUser = await prisma.user.findFirst({
          where: { authUserId: resolved.user.id },
          select: { id: true },
        })
        currentUserId = currentUser?.id ?? null
      }
    } catch (error) {
      console.warn('Failed to resolve optional product viewer', error)
    }

    const product = await prisma.product.findFirst({
      where: {
        id: BigInt(id),
        status: ProductStatus.approved,
        ...(currentUserId ? { ownerId: { not: currentUserId } } : {}),
      },
      include: publicProductInclude,
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: serializeProduct(product) })
  } catch (error) {
    console.error('Failed to load product', error)
    return NextResponse.json({ error: 'Unable to load product.' }, { status: 500 })
  }
}
