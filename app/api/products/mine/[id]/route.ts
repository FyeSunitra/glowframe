import { NextRequest, NextResponse } from 'next/server'

import { setSessionCookies } from '@/lib/auth/server'
import { getCloudinary } from '@/lib/cloudinary'
import { ProductStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import type {
  OwnerProductAction,
  UpdateOwnerProductPayload,
} from '@/types/product'
import {
  publicProductInclude,
  serializeOwnerProduct,
} from '../../_utils'
import { getOwnerRequestContext } from '../_auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const resolved = await ownerProduct(context)
    if (!resolved.ok) return resolved.response

    return withSession(
      NextResponse.json({ data: serializeOwnerProduct(resolved.product) }),
      resolved.owner,
    )
  } catch (error) {
    console.error('Failed to load owner product', error)
    return NextResponse.json({ error: 'Unable to load product.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const resolved = await ownerProduct(context)
    if (!resolved.ok) return resolved.response

    const body = await request.json()
    const action = body?.action as OwnerProductAction | undefined
    if (!action && resolved.product.status === ProductStatus.archived) {
      return NextResponse.json(
        { error: 'Archived products cannot be edited.' },
        { status: 400 },
      )
    }
    const actionData = action
      ? statusAction(action, resolved.product.status)
      : await editableData(
          body as Partial<UpdateOwnerProductPayload>,
          resolved.owner.user.id,
        )
    if (!actionData.success) {
      return NextResponse.json({ error: actionData.error }, { status: 400 })
    }

    const requestedMediaIds = new Set(
      Array.isArray(body?.media)
        ? body.media
            .map((item: { publicId?: unknown }) => item.publicId)
            .filter((value: unknown): value is string => typeof value === 'string')
        : [],
    )
    const removedMedia = action
      ? []
      : resolved.product.media.filter(
          (item) =>
            item.publicId &&
            !requestedMediaIds.has(item.publicId),
        )
    const product = await prisma.product.update({
      where: { id: resolved.product.id },
      data: actionData.data,
      include: publicProductInclude,
    })
    if (removedMedia.length) {
      try {
        const { client } = getCloudinary()
        await Promise.allSettled(
          removedMedia.map((item) =>
            client.uploader.destroy(item.publicId!, {
              resource_type: item.mediaType,
              invalidate: true,
            }),
          ),
        )
      } catch (error) {
        console.error('Failed to clean up replaced product media', error)
      }
    }

    return withSession(
      NextResponse.json({ data: serializeOwnerProduct(product) }),
      resolved.owner,
    )
  } catch (error) {
    console.error('Failed to update owner product', error)
    return NextResponse.json({ error: 'Unable to update product.' }, { status: 500 })
  }
}

async function ownerProduct(context: RouteContext) {
  const owner = await getOwnerRequestContext()
  if (!owner) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 }),
    }
  }

  const { id } = await context.params
  if (!/^\d+$/.test(id)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Product not found.' }, { status: 404 }),
    }
  }

  const product = await prisma.product.findFirst({
    where: { id: BigInt(id), ownerId: owner.user.id },
    include: publicProductInclude,
  })
  if (!product) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Product not found.' }, { status: 404 }),
    }
  }

  return { ok: true as const, owner, product }
}

function statusAction(action: OwnerProductAction, status: ProductStatus) {
  if (action === 'cancel_request' && status === ProductStatus.pending) {
    return valid({ status: ProductStatus.archived })
  }
  if (action === 'hide' && status === ProductStatus.approved) {
    return valid({ status: ProductStatus.hidden })
  }
  if (action === 'reopen' && status === ProductStatus.hidden) {
    return valid({ status: ProductStatus.approved })
  }
  return invalid('This action is not available for the current product status.')
}

async function editableData(
  body: Partial<UpdateOwnerProductPayload>,
  userId: bigint,
) {
  const title = text(body.title)
  const model = text(body.model)
  const categoryId = positiveInteger(body.categoryId)
  const brandId = positiveInteger(body.brandId)
  const customBrandName = text(body.customBrandName)
  const pickupAddressId = positiveInteger(body.pickupAddressId)
  const pricePerDay = Number(body.pricePerDay)
  const depositAmount = Number(body.depositAmount)
  if (!title || title.length > 160) return invalid('Product title is invalid.')
  if (!model || model.length > 160) return invalid('Product model is invalid.')
  if (!categoryId || !pickupAddressId) return invalid('Product data is incomplete.')
  if ((!brandId && !customBrandName) || (brandId && customBrandName)) {
    return invalid('Choose a brand or enter a custom brand.')
  }
  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) {
    return invalid('Daily price is invalid.')
  }
  if (!Number.isFinite(depositAmount) || depositAmount < 0) {
    return invalid('Deposit is invalid.')
  }

  const accessories = Array.isArray(body.accessories) ? body.accessories : []
  const customAccessories = Array.isArray(body.customAccessories)
    ? body.customAccessories
    : []
  const media = Array.isArray(body.media) ? body.media : []
  const imageCount = media.filter((item) => item.mediaType === 'image').length
  const videoCount = media.filter((item) => item.mediaType === 'video').length
  const mediaPrefix = `glowframe/products/${userId}/`
  if (
    imageCount < 1 ||
    imageCount > 8 ||
    videoCount > 1 ||
    media.some(
      (item) =>
        !item.publicId?.startsWith(mediaPrefix) ||
        !item.url?.startsWith('https://res.cloudinary.com/'),
    )
  ) {
    return invalid('Product media is invalid.')
  }

  const accessoryIds = accessories.map((item) => positiveInteger(item.accessoryId))
  if (accessoryIds.some((id) => !id)) return invalid('Accessory data is invalid.')
  const [category, brand, address, validAccessories] = await Promise.all([
    prisma.cameraCategory.findFirst({
      where: { id: BigInt(categoryId), isActive: true },
      select: { id: true },
    }),
    brandId
      ? prisma.brand.findFirst({
          where: { id: BigInt(brandId), isActive: true },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.userAddress.findFirst({
      where: { id: BigInt(pickupAddressId), userId },
      select: { id: true },
    }),
    accessoryIds.length
      ? prisma.accessory.findMany({
          where: {
            id: { in: accessoryIds.map((id) => BigInt(id!)) },
            isActive: true,
          },
          select: { id: true },
        })
      : Promise.resolve([]),
  ])
  if (
    !category ||
    (brandId && !brand) ||
    !address ||
    validAccessories.length !== new Set(accessoryIds).size
  ) {
    return invalid('One or more selected values are invalid.')
  }

  return {
    ...valid({
    title,
    model,
    categoryId: BigInt(categoryId),
    brandId: brandId ? BigInt(brandId) : null,
    customBrandName: customBrandName || null,
    pickupAddressId: BigInt(pickupAddressId),
    serialNumber: optionalText(body.serialNumber),
    description: optionalText(body.description),
    conditionNote: optionalText(body.conditionNote),
    extraDetails: optionalText(body.extraDetails),
    pricePerDay,
    depositAmount,
    status: ProductStatus.pending,
    rejectionReason: null,
    approvedBy: null,
    approvedAt: null,
    accessories: {
      deleteMany: {},
      create: accessories.map((item) => ({
        accessoryId: BigInt(item.accessoryId),
        quantity: Math.max(1, Math.min(99, Number(item.quantity))),
      })),
    },
    customAccessories: {
      deleteMany: {},
      create: customAccessories.map((item, index) => ({
        name: text(item.name).slice(0, 120),
        quantity: Math.max(1, Math.min(99, Number(item.quantity))),
        sortOrder: index,
      })),
    },
    media: {
      deleteMany: {},
      create: media.map((item, index) => ({
        mediaType: item.mediaType,
        url: item.url,
        publicId: item.publicId,
        sortOrder: index,
      })),
    },
    }),
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalText(value: unknown) {
  return text(value) || null
}

function positiveInteger(value: unknown) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function valid(data: Record<string, unknown>) {
  return { success: true as const, data }
}

function invalid(error: string) {
  return { success: false as const, error }
}

function withSession(
  response: NextResponse,
  owner: Awaited<ReturnType<typeof getOwnerRequestContext>> & {},
) {
  if (owner.refreshedSession) {
    setSessionCookies(response, owner.refreshedSession)
  }
  return response
}
