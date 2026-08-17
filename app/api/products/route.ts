import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, resolveSession, setSessionCookies, syncSupabaseUser } from '@/lib/auth/server'
import {
  MediaType,
  ProductStatus,
  VerificationStatus,
} from '@/lib/generated/prisma/client'
import {
  getCloudinary,
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_VIDEO_MAX_BYTES,
} from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import type { CreateProductPayload } from '@/types/product'
import { publicProductInclude, serializeProduct } from './_utils'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: ProductStatus.approved,
      },
      orderBy: { createdAt: 'desc' },
      include: publicProductInclude,
    })

    return NextResponse.json({
      data: products.map(serializeProduct),
    })
  } catch (error) {
    console.error('Failed to load products', error)
    return NextResponse.json({ error: 'Unable to load products.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authenticated = await authenticatedUser()
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const verified = await prisma.identityVerification.findFirst({
      where: {
        userId: authenticated.user.id,
        status: VerificationStatus.approved,
        reviewedBy: { not: null },
      },
      select: { id: true },
    })
    if (!verified) {
      return NextResponse.json(
        { error: 'Admin-approved identity verification is required.' },
        { status: 403 },
      )
    }

    const body = (await req.json()) as Partial<CreateProductPayload>
    const validation = validateProductInput(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const input = validation.data

    const [category, brand, pickupAddress, validAccessories] = await Promise.all([
      prisma.cameraCategory.findFirst({
        where: { id: BigInt(input.categoryId), isActive: true },
        select: { id: true },
      }),
      input.brandId
        ? prisma.brand.findFirst({
            where: { id: BigInt(input.brandId), isActive: true },
            select: { id: true },
          })
        : Promise.resolve(null),
      prisma.userAddress.findFirst({
        where: {
          id: BigInt(input.pickupAddressId),
          userId: authenticated.user.id,
        },
        select: { id: true },
      }),
      input.accessories.length
        ? prisma.accessory.findMany({
            where: {
              id: { in: input.accessories.map((item) => BigInt(item.accessoryId)) },
              isActive: true,
            },
            select: { id: true },
          })
        : Promise.resolve([]),
    ])

    if (!category) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    }
    if (input.brandId && !brand) {
      return NextResponse.json({ error: 'Invalid brand.' }, { status: 400 })
    }
    if (!pickupAddress) {
      return NextResponse.json({ error: 'Invalid pickup address.' }, { status: 400 })
    }
    if (validAccessories.length !== input.accessories.length) {
      return NextResponse.json({ error: 'One or more accessories are invalid.' }, { status: 400 })
    }

    const verifiedMedia = await verifyProductMedia(
      input.media,
      authenticated.user.id,
    )
    if (!verifiedMedia.success) {
      return NextResponse.json({ error: verifiedMedia.error }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        ownerId: authenticated.user.id,
        categoryId: BigInt(input.categoryId),
        brandId: input.brandId ? BigInt(input.brandId) : null,
        customBrandName: input.customBrandName,
        pickupAddressId: BigInt(input.pickupAddressId),
        title: input.title,
        model: input.model,
        serialNumber: input.serialNumber || null,
        description: input.description || null,
        conditionNote: input.conditionNote || null,
        extraDetails: input.extraDetails || null,
        pricePerDay: input.pricePerDay,
        depositAmount: input.depositAmount,
        status: ProductStatus.pending,
        accessories: {
          create: input.accessories.map((item) => ({
            accessoryId: BigInt(item.accessoryId),
            quantity: item.quantity,
          })),
        },
        customAccessories: {
          create: input.customAccessories.map((item, index) => ({
            name: item.name,
            quantity: item.quantity,
            sortOrder: index,
          })),
        },
        media: {
          create: verifiedMedia.data.map((item, index) => ({
            mediaType:
              item.mediaType === 'video' ? MediaType.video : MediaType.image,
            url: item.url,
            publicId: item.publicId,
            sortOrder: index,
          })),
        },
      },
      include: publicProductInclude,
    })

    const response = NextResponse.json({ data: serializeProduct(product) }, { status: 201 })
    if (authenticated.refreshedSession) {
      setSessionCookies(response, authenticated.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to create product', error)
    return NextResponse.json({ error: 'Unable to create product.' }, { status: 500 })
  }
}

async function authenticatedUser() {
  const cookieStore = await cookies()
  const resolved = await resolveSession(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  )
  if (!resolved) return null

  return {
    user: await syncSupabaseUser(resolved.user),
    refreshedSession: resolved.session,
  }
}

function validateProductInput(body: Partial<CreateProductPayload>) {
  const title = stringValue(body.title)
  const model = stringValue(body.model)
  const customBrandName = stringValue(body.customBrandName)
  const brandId = positiveInteger(body.brandId)
  const categoryId = positiveInteger(body.categoryId)
  const pickupAddressId = positiveInteger(body.pickupAddressId)
  const pricePerDay = Number(body.pricePerDay)
  const depositAmount = Number(body.depositAmount)
  const media = parseMedia(body.media)

  if (!title || title.length > 160) return invalid('Product title is required.')
  if (!model || model.length > 160) return invalid('Product model is required.')
  if (!categoryId) return invalid('Category is required.')
  if ((!brandId && !customBrandName) || (brandId && customBrandName)) {
    return invalid('Choose a brand or enter one custom brand.')
  }
  if (customBrandName.length > 120) return invalid('Custom brand is too long.')
  if (!pickupAddressId) return invalid('Pickup address is required.')
  if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) return invalid('Daily price is invalid.')
  if (!Number.isFinite(depositAmount) || depositAmount < 0) return invalid('Deposit is invalid.')
  if (!media.success) return invalid(media.error)

  const accessoryMap = new Map<number, number>()
  for (const item of Array.isArray(body.accessories) ? body.accessories : []) {
    const accessoryId = positiveInteger(item.accessoryId)
    const quantity = positiveInteger(item.quantity)
    if (!accessoryId || !quantity || quantity > 99) return invalid('Accessory data is invalid.')
    accessoryMap.set(accessoryId, quantity)
  }

  const customAccessoryMap = new Map<string, { name: string; quantity: number }>()
  for (const item of Array.isArray(body.customAccessories) ? body.customAccessories : []) {
    const name = stringValue(item.name)
    const quantity = positiveInteger(item.quantity)
    if (!name || name.length > 120 || !quantity || quantity > 99) {
      return invalid('Custom accessory data is invalid.')
    }
    customAccessoryMap.set(name.toLocaleLowerCase(), { name, quantity })
  }

  return {
    success: true as const,
    data: {
      title,
      categoryId,
      brandId,
      customBrandName: customBrandName || null,
      model,
      serialNumber: optionalText(body.serialNumber, 160),
      description: optionalText(body.description),
      conditionNote: optionalText(body.conditionNote),
      extraDetails: optionalText(body.extraDetails),
      pricePerDay,
      depositAmount,
      pickupAddressId,
      accessories: [...accessoryMap].map(([accessoryId, quantity]) => ({
        accessoryId,
        quantity,
      })),
      customAccessories: [...customAccessoryMap.values()],
      media: media.data,
    },
  }
}

function parseMedia(value: unknown) {
  if (!Array.isArray(value)) return invalid('At least one product image is required.')

  const data: Array<{
    mediaType: 'image' | 'video'
    url: string
    publicId: string
  }> = []
  const publicIds = new Set<string>()

  for (const item of value) {
    if (!item || typeof item !== 'object') return invalid('Product media is invalid.')
    const mediaType =
      'mediaType' in item && (item.mediaType === 'image' || item.mediaType === 'video')
        ? item.mediaType
        : null
    const url = 'url' in item ? stringValue(item.url) : ''
    const publicId = 'publicId' in item ? stringValue(item.publicId) : ''

    if (!mediaType || !url || !publicId || publicIds.has(publicId)) {
      return invalid('Product media is invalid.')
    }
    try {
      if (new URL(url).hostname !== 'res.cloudinary.com') {
        return invalid('Product media must be stored in Cloudinary.')
      }
    } catch {
      return invalid('Product media URL is invalid.')
    }

    publicIds.add(publicId)
    data.push({ mediaType, url, publicId })
  }

  const imageCount = data.filter((item) => item.mediaType === 'image').length
  const videoCount = data.filter((item) => item.mediaType === 'video').length
  if (imageCount < 1 || imageCount > 8 || videoCount > 1) {
    return invalid('Add 1-8 product images and no more than one video.')
  }

  return { success: true as const, data }
}

async function verifyProductMedia(
  media: Array<{
    mediaType: 'image' | 'video'
    url: string
    publicId: string
  }>,
  userId: bigint,
) {
  const allowedPrefix = `glowframe/products/${userId}/`
  if (media.some((item) => !item.publicId.startsWith(allowedPrefix))) {
    return invalid('Product media does not belong to this account.')
  }

  try {
    const { client } = getCloudinary()
    const assets = await Promise.all(
      media.map((item) =>
        client.api.resource(item.publicId, {
          resource_type: item.mediaType,
          type: 'upload',
        }),
      ),
    )

    const data = assets.map((asset, index) => {
      const expected = media[index]
      const maxBytes =
        expected.mediaType === 'video'
          ? PRODUCT_VIDEO_MAX_BYTES
          : PRODUCT_IMAGE_MAX_BYTES
      if (
        asset.resource_type !== expected.mediaType ||
        typeof asset.secure_url !== 'string' ||
        typeof asset.bytes !== 'number' ||
        asset.bytes > maxBytes
      ) {
        throw new Error('Cloudinary asset validation failed.')
      }

      return {
        mediaType: expected.mediaType,
        url: asset.secure_url,
        publicId: expected.publicId,
      }
    })

    return { success: true as const, data }
  } catch (error) {
    console.error('Failed to verify Cloudinary product media', error)
    return invalid('One or more Cloudinary media files could not be verified.')
  }
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalText(value: unknown, maxLength = 5000) {
  const text = stringValue(value)
  return text ? text.slice(0, maxLength) : ''
}

function positiveInteger(value: unknown) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function invalid(error: string) {
  return { success: false as const, error }
}
