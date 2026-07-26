import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

const SETTINGS_ID = 1

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function finiteNumber(value: unknown, field: string, min = 0, max?: number) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || (max !== undefined && number > max)) {
    throw new Error(`${field} is invalid`)
  }
  return number
}

function finiteInteger(value: unknown, field: string, min = 0) {
  const number = finiteNumber(value, field, min)
  if (!Number.isInteger(number)) throw new Error(`${field} must be an integer`)
  return number
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`)
  return value.trim()
}

async function ensurePlatformSetting() {
  const existing = await prisma.platformSetting.findUnique({
    where: { id: SETTINGS_ID },
    include: { platformBank: true },
  })

  if (existing) return existing

  const [platformBank, banks] = await Promise.all([
    prisma.bank.findFirst({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    }),
    prisma.bank.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { name: true },
    }),
  ])

  return prisma.platformSetting.create({
    data: {
      id: SETTINGS_ID,
      platformBankId: platformBank?.id,
      supportedBanks: banks.map((bank) => bank.name).join(', '),
    },
    include: { platformBank: true },
  })
}

async function getSettingsData() {
  const [settings, admins] = await Promise.all([
    ensurePlatformSetting(),
    prisma.user.findMany({
      where: { role: 'admin' },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
      },
    }),
  ])

  return {
    fees: {
      platformFee: Number(settings.platformFee),
      minPayout: Number(settings.minPayout),
      lateFeePerDay: Number(settings.lateFeePerDay),
    },
    booking: {
      minAdvanceDays: settings.minAdvanceDays,
      paymentDeadlineHours: settings.paymentDeadlineHours,
      ownerPrepDays: settings.ownerPrepDays,
      cancellationWindowHours: settings.cancellationWindowHours,
    },
    payment: {
      platformBankName: settings.platformBank?.name ?? '',
      platformAccountName: settings.platformAccountName,
      platformAccountNo: settings.platformAccountNo,
      paymentReviewHours: settings.paymentReviewHours,
      payoutReviewDays: settings.payoutReviewDays,
      supportedBanks: settings.supportedBanks,
    },
    admins: admins.map((admin) => ({
      id: Number(admin.id),
      name: admin.displayName,
      email: admin.email,
      role: admin.role,
    })),
  }
}

export async function GET() {
  try {
    return NextResponse.json({ data: await getSettingsData() })
  } catch (error) {
    console.error('Failed to load admin settings', error)
    return errorResponse('Failed to load admin settings', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as {
      section?: string
      data?: Record<string, unknown>
      id?: number
    }
    const data = body.data ?? {}

    if (body.section === 'fees') {
      await prisma.platformSetting.update({
        where: { id: (await ensurePlatformSetting()).id },
        data: {
          platformFee: finiteNumber(data.platformFee, 'platformFee', 0, 100),
          minPayout: finiteNumber(data.minPayout, 'minPayout'),
          lateFeePerDay: finiteNumber(data.lateFeePerDay, 'lateFeePerDay'),
        },
      })
    } else if (body.section === 'booking') {
      await prisma.platformSetting.update({
        where: { id: (await ensurePlatformSetting()).id },
        data: {
          minAdvanceDays: finiteInteger(data.minAdvanceDays, 'minAdvanceDays'),
          paymentDeadlineHours: finiteInteger(data.paymentDeadlineHours, 'paymentDeadlineHours', 1),
          ownerPrepDays: finiteInteger(data.ownerPrepDays, 'ownerPrepDays'),
          cancellationWindowHours: finiteInteger(data.cancellationWindowHours, 'cancellationWindowHours'),
        },
      })
    } else if (body.section === 'payment') {
      const platformBankName = requiredString(data.platformBankName, 'platformBankName')
      const platformBank = await prisma.bank.findFirst({
        where: { name: { equals: platformBankName, mode: 'insensitive' } },
      })

      if (!platformBank) return errorResponse('Platform bank was not found')

      await prisma.platformSetting.update({
        where: { id: (await ensurePlatformSetting()).id },
        data: {
          platformBankId: platformBank.id,
          platformAccountName: requiredString(data.platformAccountName, 'platformAccountName'),
          platformAccountNo: requiredString(data.platformAccountNo, 'platformAccountNo'),
          paymentReviewHours: finiteInteger(data.paymentReviewHours, 'paymentReviewHours', 1),
          payoutReviewDays: finiteInteger(data.payoutReviewDays, 'payoutReviewDays', 1),
          supportedBanks: requiredString(data.supportedBanks, 'supportedBanks'),
        },
      })
    } else if (body.section === 'addAdmin') {
      const email = requiredString(data.email, 'email').toLowerCase()
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true },
      })

      if (!user) return errorResponse('User account was not found', 404)
      if (user.role === 'admin') return errorResponse('User is already an admin', 409)

      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' },
      })
    } else if (body.section === 'removeAdmin') {
      if (!Number.isSafeInteger(body.id) || Number(body.id) <= 0) {
        return errorResponse('Admin account id is invalid')
      }

      const adminCount = await prisma.user.count({
        where: { role: 'admin' },
      })
      if (adminCount <= 1) return errorResponse('The last admin cannot be removed', 409)

      const updated = await prisma.user.updateMany({
        where: {
          id: BigInt(body.id as number),
          role: 'admin',
        },
        data: { role: 'user' },
      })

      if (updated.count === 0) return errorResponse('Admin account was not found', 404)
    } else {
      return errorResponse('Settings section is invalid')
    }

    return NextResponse.json({ data: await getSettingsData() })
  } catch (error: unknown) {
    if (error instanceof Error && (
      error.message.endsWith(' is invalid')
      || error.message.endsWith(' is required')
      || error.message.endsWith(' must be an integer')
    )) {
      return errorResponse(error.message)
    }

    console.error('Failed to update admin settings', error)
    return errorResponse('Failed to update admin settings', 500)
  }
}
