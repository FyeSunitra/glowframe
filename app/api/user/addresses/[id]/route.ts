import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  syncSupabaseUser,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

function addressData(address: {
  id: bigint
  label: string
  recipientName: string
  recipientPhone: string
  addressLine: string
  province: string
  district: string | null
  subdistrict: string | null
  postalCode: string | null
  landmark: string | null
  isDefault: boolean
}) {
  return {
    id: Number(address.id),
    label: address.label,
    recipientName: address.recipientName,
    recipientPhone: address.recipientPhone,
    addressLine: address.addressLine,
    province: address.province,
    district: address.district ?? '',
    subdistrict: address.subdistrict ?? '',
    postalCode: address.postalCode ?? '',
    landmark: address.landmark ?? '',
    isDefault: address.isDefault,
    detail: [
      address.addressLine,
      address.subdistrict,
      address.district,
      address.province,
      address.postalCode,
    ]
      .filter(Boolean)
      .join(' '),
  }
}

function addressPayload(body: Record<string, unknown>) {
  return {
    label: typeof body.label === 'string' ? body.label.trim() : '',
    recipientName:
      typeof body.recipientName === 'string' ? body.recipientName.trim() : '',
    recipientPhone:
      typeof body.recipientPhone === 'string' ? body.recipientPhone.trim() : '',
    addressLine: typeof body.addressLine === 'string' ? body.addressLine.trim() : '',
    province: typeof body.province === 'string' ? body.province.trim() : '',
    district: typeof body.district === 'string' ? body.district.trim() : '',
    subdistrict: typeof body.subdistrict === 'string' ? body.subdistrict.trim() : '',
    postalCode: typeof body.postalCode === 'string' ? body.postalCode.trim() : '',
    landmark: typeof body.landmark === 'string' ? body.landmark.trim() : '',
    isDefault: body.isDefault === true,
  }
}

function validateAddress(payload: ReturnType<typeof addressPayload>) {
  if (
    !payload.label ||
    !payload.recipientName ||
    !payload.recipientPhone ||
    !payload.addressLine ||
    !payload.province ||
    !payload.district ||
    !payload.subdistrict ||
    !payload.postalCode
  ) {
    return 'Please complete all required address fields.'
  }
  if (!/^[0-9+\-()\s]{8,20}$/.test(payload.recipientPhone)) {
    return 'Phone number is invalid.'
  }
  if (!/^\d{5}$/.test(payload.postalCode)) {
    return 'Postal code must contain 5 digits.'
  }
  return null
}

async function currentUserId() {
  const cookieStore = await cookies()
  const resolved = await resolveSession(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  )
  if (!resolved) return null
  return (await syncSupabaseUser(resolved.user)).id
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await currentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const { id } = await params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    }

    const existing = await prisma.userAddress.findFirst({
      where: { id: BigInt(id), userId },
      select: { id: true, isDefault: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const payload = addressPayload(body)
    const validationError = validateAddress(payload)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const shouldBeDefault = payload.isDefault || existing.isDefault
    const address = await prisma.$transaction(async (transaction) => {
      if (payload.isDefault) {
        await transaction.userAddress.updateMany({
          where: { userId, isDefault: true, id: { not: existing.id } },
          data: { isDefault: false },
        })
      }

      return transaction.userAddress.update({
        where: { id: existing.id },
        data: {
          ...payload,
          isDefault: shouldBeDefault,
        },
      })
    })

    return NextResponse.json({ data: addressData(address) })
  } catch (error) {
    console.error('Failed to update address', error)
    return NextResponse.json({ error: 'Unable to update address.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await currentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const { id } = await params
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    }

    const address = await prisma.userAddress.findFirst({
      where: { id: BigInt(id), userId },
      select: { id: true, isDefault: true },
    })
    if (!address) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.userAddress.delete({ where: { id: address.id } })
      if (address.isDefault) {
        const replacement = await transaction.userAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        })
        if (replacement) {
          await transaction.userAddress.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          })
        }
      }
    })

    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('Failed to delete address', error)
    return NextResponse.json(
      { error: 'This address may still be used by a product and cannot be deleted.' },
      { status: 409 },
    )
  }
}
