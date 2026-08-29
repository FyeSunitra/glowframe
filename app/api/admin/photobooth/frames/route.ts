import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

import { serializePhotoboothFrame, validatePhotoboothFrameInput } from '@/lib/photoboothFrames'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const page = Math.max(1, Number(params.get('page')) || 1)
    const limit = Math.min(50, Math.max(1, Number(params.get('limit')) || 10))
    const search = params.get('search')?.trim()
    const where = search
      ? {
          OR: [
            { nameTh: { contains: search, mode: 'insensitive' as const } },
            { nameEn: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined
    const [frames, total] = await Promise.all([
      prisma.photoboothFrame.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.photoboothFrame.count({ where }),
    ])
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
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    })
  } catch (error) {
    console.error('Failed to load admin photobooth frames', error)
    return NextResponse.json({ error: 'Unable to load photobooth frames.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const validation = validatePhotoboothFrameInput(await request.json())
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { price, ...frameData } = validation.data
    const frame = await prisma.$transaction(async (transaction) => {
      const created = await transaction.photoboothFrame.create({ data: frameData })
      await transaction.$executeRaw`
        UPDATE "photobooth_frames"
        SET "price" = ${price}
        WHERE "id" = ${created.id}
      `
      return created
    })
    return NextResponse.json(
      { data: serializePhotoboothFrame({ ...frame, price }) },
      { status: 201 },
    )
  } catch (error) {
    console.error('Failed to create photobooth frame', error)
    return NextResponse.json({ error: 'Unable to create the photobooth frame.' }, { status: 500 })
  }
}
