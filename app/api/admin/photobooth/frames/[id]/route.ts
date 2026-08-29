import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/lib/generated/prisma/client'

import { getCloudinary } from '@/lib/cloudinary'
import { serializePhotoboothFrame, validatePhotoboothFrameInput } from '@/lib/photoboothFrames'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = await frameId(context)
  if (!id) return notFound()
  const frame = await prisma.photoboothFrame.findUnique({ where: { id } })
  if (!frame) return notFound()
  const [priceRecord] = await prisma.$queryRaw<Array<{ price: Prisma.Decimal | null }>>`
    SELECT "price" FROM "photobooth_frames" WHERE "id" = ${id}
  `
  return NextResponse.json({
    data: serializePhotoboothFrame({ ...frame, price: priceRecord?.price ?? null }),
  })
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = await frameId(context)
  if (!id) return notFound()
  try {
    const current = await prisma.photoboothFrame.findUnique({ where: { id } })
    if (!current) return notFound()
    const [priceRecord] = await prisma.$queryRaw<Array<{ price: Prisma.Decimal | null }>>`
      SELECT "price" FROM "photobooth_frames" WHERE "id" = ${id}
    `
    const body = await request.json()
    const validation = validatePhotoboothFrameInput({
      nameTh: body.nameTh ?? current.nameTh,
      nameEn: body.nameEn ?? current.nameEn,
      descriptionTh: body.descriptionTh !== undefined ? body.descriptionTh : current.descriptionTh,
      descriptionEn: body.descriptionEn !== undefined ? body.descriptionEn : current.descriptionEn,
      canvasWidth: body.canvasWidth ?? current.canvasWidth,
      canvasHeight: body.canvasHeight ?? current.canvasHeight,
      aspectRatioLabel: body.aspectRatioLabel ?? current.aspectRatioLabel,
      slots: body.slots ?? current.slotConfig,
      overlayUrl: body.overlayUrl ?? current.overlayUrl,
      overlayPublicId: body.overlayPublicId ?? current.overlayPublicId,
      originalFileName: body.originalFileName ?? current.originalFileName,
      price: body.price !== undefined ? body.price : priceRecord?.price ?? null,
      active: body.active ?? current.isActive,
      sortOrder: body.sortOrder ?? current.sortOrder,
    })
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })
    const { price, ...frameData } = validation.data
    const frame = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.photoboothFrame.update({ where: { id }, data: frameData })
      await transaction.$executeRaw`
        UPDATE "photobooth_frames"
        SET "price" = ${price}
        WHERE "id" = ${id}
      `
      return updated
    })
    return NextResponse.json({ data: serializePhotoboothFrame({ ...frame, price }) })
  } catch (error) {
    console.error('Failed to update photobooth frame', error)
    return NextResponse.json({ error: 'Unable to update the photobooth frame.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = await frameId(context)
  if (!id) return notFound()
  try {
    const frame = await prisma.photoboothFrame.delete({ where: { id } })
    const { client } = getCloudinary()
    await client.uploader.destroy(frame.overlayPublicId, { resource_type: 'image', invalidate: true })
    return NextResponse.json({ data: null })
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2025') return notFound()
    console.error('Failed to delete photobooth frame', error)
    return NextResponse.json({ error: 'Unable to delete the photobooth frame.' }, { status: 500 })
  }
}

async function frameId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  return /^\d+$/.test(id) ? BigInt(id) : null
}

function notFound() {
  return NextResponse.json({ error: 'Frame not found.' }, { status: 404 })
}
