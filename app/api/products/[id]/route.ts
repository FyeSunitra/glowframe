import { NextRequest, NextResponse } from 'next/server'

import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
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
    const product = await prisma.product.findFirst({
      where: {
        id: BigInt(id),
        status: ProductStatus.approved,
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
