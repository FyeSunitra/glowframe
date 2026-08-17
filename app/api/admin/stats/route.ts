import { NextResponse } from 'next/server'

import { getAdminRequestContext } from '@/lib/auth/adminRequest'
import { setSessionCookies } from '@/lib/auth/server'
import {
  BookingStatus,
  PaymentStatus,
  ProductStatus,
  ReturnStatus,
  UserRole,
} from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'

const excludedBookingStatuses = [
  BookingStatus.cancelled,
  BookingStatus.expired,
]

export async function GET() {
  try {
    const admin = await getAdminRequestContext()
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
    }

    const now = new Date()
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    )
    const trendStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1),
    )
    const activeMonthlyBookingWhere = {
      createdAt: { gte: monthStart },
      status: { notIn: excludedBookingStatuses },
    }

    const [
      totalUsers,
      approvedListings,
      monthlyBookings,
      monthlyValue,
      pendingProducts,
      pendingPayments,
      pendingReturns,
      openDisputes,
      trendBookings,
      statusGroups,
      recentBookings,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count({ where: { role: UserRole.user } }),
      prisma.product.count({ where: { status: ProductStatus.approved } }),
      prisma.booking.count({ where: activeMonthlyBookingWhere }),
      prisma.booking.aggregate({
        where: activeMonthlyBookingWhere,
        _sum: { totalAmount: true },
      }),
      prisma.product.count({ where: { status: ProductStatus.pending } }),
      prisma.payment.count({ where: { status: PaymentStatus.pendingReview } }),
      prisma.rentalReturn.count({
        where: {
          status: ReturnStatus.renterReturned,
          booking: { status: BookingStatus.returnPending },
        },
      }),
      prisma.rentalReturn.count({
        where: {
          status: ReturnStatus.damageReported,
          reviewedAt: null,
          booking: { status: BookingStatus.disputed },
        },
      }),
      prisma.booking.findMany({
        where: {
          createdAt: { gte: trendStart },
          status: { notIn: excludedBookingStatuses },
        },
        select: { createdAt: true, totalAmount: true },
      }),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { _all: true },
        orderBy: { _count: { status: 'desc' } },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          bookingNo: true,
          startDate: true,
          endDate: true,
          totalAmount: true,
          status: true,
          product: { select: { title: true } },
          renter: { select: { displayName: true } },
        },
      }),
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          status: true,
          submittedAmount: true,
          submittedAt: true,
          createdAt: true,
          booking: { select: { bookingNo: true } },
          payer: { select: { displayName: true } },
        },
      }),
    ])

    const trend = createMonthBuckets(now)
    for (const booking of trendBookings) {
      const bucket = trend.find(
        (item) => item.month === monthKey(booking.createdAt),
      )
      if (!bucket) continue
      bucket.bookings += 1
      bucket.value += Number(booking.totalAmount)
    }

    const response = NextResponse.json({
      data: {
        stats: {
          totalUsers,
          approvedListings,
          monthlyBookings,
          monthlyBookingValue: Number(monthlyValue._sum.totalAmount ?? 0),
        },
        queues: {
          pendingProducts,
          pendingPayments,
          pendingReturns,
          openDisputes,
        },
        bookingTrend: trend,
        bookingStatusBreakdown: statusGroups.map((item) => ({
          status: item.status,
          count: item._count._all,
        })),
        recentBookings: recentBookings.map((booking) => ({
          id: Number(booking.id),
          bookingNo: booking.bookingNo,
          productName: booking.product.title,
          renterName: booking.renter.displayName,
          startDate: booking.startDate.toISOString().slice(0, 10),
          endDate: booking.endDate.toISOString().slice(0, 10),
          total: Number(booking.totalAmount),
          status: booking.status,
        })),
        recentPayments: recentPayments.map((payment) => ({
          id: Number(payment.id),
          bookingNo: payment.booking.bookingNo,
          payerName: payment.payer.displayName,
          amount: Number(payment.submittedAmount ?? 0),
          status: payment.status,
          submittedAt: (
            payment.submittedAt ?? payment.createdAt
          ).toISOString(),
        })),
      },
    })
    if (admin.refreshedSession) {
      setSessionCookies(response, admin.refreshedSession)
    }
    return response
  } catch (error) {
    console.error('Failed to load admin dashboard', error)
    return NextResponse.json(
      { error: 'Unable to load dashboard data.' },
      { status: 500 },
    )
  }
}

function createMonthBuckets(now: Date) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
    )
    return { month: monthKey(date), bookings: 0, value: 0 }
  })
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}
