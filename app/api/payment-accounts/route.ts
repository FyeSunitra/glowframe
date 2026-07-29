import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const accounts = await prisma.platformPaymentAccount.findMany({
      where: {
        settingId: 1,
        isActive: true,
        bank: { isActive: true },
      },
      include: { bank: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    })

    return NextResponse.json({
      data: accounts.map((account) => ({
        id: Number(account.id),
        method: account.bank.code === 'PROMPTPAY' ? 'promptpay' : 'bank_transfer',
        bank: {
          id: Number(account.bank.id),
          code: account.bank.code,
          abbreviation: account.bank.abbreviation,
          name: account.bank.name,
          logoUrl: account.bank.logoUrl,
        },
        accountName: account.accountName,
        accountNumber: account.accountNumber,
      })),
    })
  } catch (error) {
    console.error('Failed to load platform payment accounts', error)
    return NextResponse.json(
      { error: 'Failed to load payment accounts' },
      { status: 500 },
    )
  }
}
