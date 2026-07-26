import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  resolveSession,
  syncSupabaseUser,
} from '@/lib/auth/server'
import { prisma } from '@/lib/prisma'

async function currentUserId() {
  const cookieStore = await cookies()
  const resolved = await resolveSession(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value,
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  )
  if (!resolved) return null
  return (await syncSupabaseUser(resolved.user)).id
}

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
  const location = [
    address.addressLine,
    address.subdistrict,
    address.district,
    address.province,
    address.postalCode,
  ].filter(Boolean)

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
    detail: location.join(' '),
  }
}

export async function GET() {
  try {
    const userId = await currentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ data: addresses.map(addressData) })
  } catch (error) {
    console.error('Failed to load addresses', error)
    return NextResponse.json({ error: 'Unable to load addresses.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await currentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 })
    }

    const body = await request.json()
    const payload = {
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
      return NextResponse.json(
        { error: 'Please complete all required address fields.' },
        { status: 400 },
      )
    }
    if (!/^[0-9+\-()\s]{8,20}$/.test(payload.recipientPhone)) {
      return NextResponse.json({ error: 'Phone number is invalid.' }, { status: 400 })
    }
    if (!/^\d{5}$/.test(payload.postalCode)) {
      return NextResponse.json({ error: 'Postal code must contain 5 digits.' }, { status: 400 })
    }

    const addressCount = await prisma.userAddress.count({ where: { userId } })
    const shouldBeDefault = payload.isDefault || addressCount === 0
    const address = await prisma.$transaction(async (transaction) => {
      if (shouldBeDefault) {
        await transaction.userAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        })
      }

      return transaction.userAddress.create({
        data: {
          userId,
          ...payload,
          isDefault: shouldBeDefault,
        },
      })
    })

    return NextResponse.json({ data: addressData(address) }, { status: 201 })
  } catch (error) {
    console.error('Failed to create address', error)
    return NextResponse.json({ error: 'Unable to save address.' }, { status: 500 })
  }
}
