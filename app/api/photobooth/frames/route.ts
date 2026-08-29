import { NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

import { serializePhotoboothFrame } from '@/lib/photoboothFrames'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const frames = await prisma.photoboothFrame.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    const prices = frames.length
      ? await prisma.$queryRaw<Array<{ id: bigint; price: Prisma.Decimal | null }>>(
          Prisma.sql`SELECT "id", "price" FROM "photobooth_frames" WHERE "id" IN (${Prisma.join(frames.map((frame) => frame.id))})`,
        )
      : []
    const priceById = new Map(prices.map((item) => [item.id.toString(), item.price]))
    return NextResponse.json({
      data: frames.map((frame) =>
        serializePhotoboothFrame({
          ...frame,
          price: priceById.get(frame.id.toString()) ?? null,
        }),
      ),
    })
  } catch (error) {
    console.error('Failed to load public photobooth frames', error)
    return NextResponse.json({ error: 'Unable to load photobooth frames.' }, { status: 500 })
  }
}
