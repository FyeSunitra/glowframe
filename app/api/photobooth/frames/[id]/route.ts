import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

import { serializePhotoboothFrame } from '@/lib/photoboothFrames'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Frame not found.' }, { status: 404 })
  try {
    const frame = await prisma.photoboothFrame.findFirst({
      where: { id: BigInt(id), isActive: true },
    })
    if (!frame) return NextResponse.json({ error: 'Frame not found.' }, { status: 404 })
    const [priceRecord] = await prisma.$queryRaw<Array<{ price: Prisma.Decimal | null }>>`
      SELECT "price" FROM "photobooth_frames" WHERE "id" = ${frame.id}
    `
    return NextResponse.json({
      data: serializePhotoboothFrame({ ...frame, price: priceRecord?.price ?? null }),
    })
  } catch (error) {
    console.error('Failed to load public photobooth frame', error)
    return NextResponse.json({ error: 'Unable to load the photobooth frame.' }, { status: 500 })
  }
}
