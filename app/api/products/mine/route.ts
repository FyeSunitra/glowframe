import { NextResponse } from 'next/server'

import {
  setSessionCookies,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'
import { publicProductInclude, serializeOwnerProduct } from '../_utils'
import { getOwnerRequestContext } from './_auth'

export async function GET() {
  try {
    const owner = await getOwnerRequestContext()
    if (!owner) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: { ownerId: owner.user.id },
      include: publicProductInclude,
      orderBy: { createdAt: 'desc' },
    })

    const response = NextResponse.json({
      data: products.map(serializeOwnerProduct),
    })
    if (owner.refreshedSession) {
      setSessionCookies(response, owner.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load owner products', error)
    return NextResponse.json(
      { error: 'Unable to load your product listings.' },
      { status: 500 },
    )
  }
}
