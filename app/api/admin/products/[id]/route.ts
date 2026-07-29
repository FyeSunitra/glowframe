import { NextRequest, NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import { getCloudinary } from '@/lib/cloudinary'
import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { adminProductInclude, serializeAdminProduct } from '../_utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { id } = await params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: adminProductInclude,
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    const response = NextResponse.json({ data: serializeAdminProduct(product) })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load admin product details', error)
    return NextResponse.json(
      { error: 'Unable to load product details.' },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { id } = await params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })
    }

    const body = await request.json()
    const action = typeof body.action === 'string' ? body.action : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (action === 'reject' && !reason) {
      return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 })
    }

    const data =
      action === 'approve'
        ? {
            status: ProductStatus.approved,
            approvedBy: admin.user.id,
            approvedAt: new Date(),
            rejectionReason: null,
          }
        : action === 'reject'
          ? {
              status: ProductStatus.rejected,
              rejectionReason: reason,
              approvedBy: null,
              approvedAt: null,
            }
          : action === 'archive'
            ? { status: ProductStatus.archived }
            : editableFields(body)

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'No valid changes were provided.' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id: BigInt(id) },
      data,
      include: adminProductInclude,
    })
    const response = NextResponse.json({ data: serializeAdminProduct(product) })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to update admin product', error)
    return NextResponse.json({ error: 'Unable to update product listing.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const { id } = await params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })
    }

    const productId = BigInt(id)
    const booking = await prisma.booking.findFirst({
      where: { productId },
      select: { id: true },
    })
    if (booking) {
      return NextResponse.json(
        { error: 'A product with booking history cannot be deleted. Archive it instead.' },
        { status: 409 },
      )
    }

    const media = await prisma.productMedia.findMany({
      where: { productId },
      select: { publicId: true, mediaType: true },
    })
    await prisma.$transaction([
      prisma.productAccessory.deleteMany({ where: { productId } }),
      prisma.productCustomAccessory.deleteMany({ where: { productId } }),
      prisma.productMedia.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ])
    const cloudinaryMedia = media.filter(
      (item): item is typeof item & { publicId: string } => Boolean(item.publicId),
    )
    if (cloudinaryMedia.length) {
      try {
        const { client } = getCloudinary()
        const deleted = await Promise.allSettled(
          cloudinaryMedia.map((item) =>
            client.uploader.destroy(item.publicId, {
              resource_type: item.mediaType,
              invalidate: true,
            }),
          ),
        )
        if (deleted.some((result) => result.status === 'rejected')) {
          console.error('One or more Cloudinary product assets could not be deleted', {
            productId: id,
          })
        }
      } catch (error) {
        console.error('Failed to clean up Cloudinary product assets', {
          productId: id,
          error,
        })
      }
    }

    const response = NextResponse.json({ data: null })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to delete admin product', error)
    return NextResponse.json({ error: 'Unable to delete product listing.' }, { status: 500 })
  }
}

function editableFields(body: Record<string, unknown>) {
  const title = text(body.name)
  const description = text(body.desc)
  const extraDetails = text(body.extra)
  const pricePerDay = Number(body.price)
  const depositAmount = Number(body.deposit)

  return {
    ...(title ? { title: title.slice(0, 160) } : {}),
    ...(description ? { description } : {}),
    ...(extraDetails ? { extraDetails } : {}),
    ...(Number.isFinite(pricePerDay) && pricePerDay > 0 ? { pricePerDay } : {}),
    ...(Number.isFinite(depositAmount) && depositAmount >= 0 ? { depositAmount } : {}),
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}
