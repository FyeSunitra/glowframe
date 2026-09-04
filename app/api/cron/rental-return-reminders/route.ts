import { NextRequest, NextResponse } from 'next/server'

import { BookingStatus } from '@/lib/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import {
  createRentalFlowNotifications,
  deliverNotificationAfterCommit,
} from '@/lib/notifications/notificationService'

export async function GET(request: NextRequest) {
  const configuredSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!configuredSecret || authorization !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const today = utcDayStart(new Date())
  const tomorrow = new Date(today)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const bookings = await prisma.booking.findMany({
    where: { status: BookingStatus.active, endDate: tomorrow },
    select: {
      id: true,
      bookingNo: true,
      product: { select: { title: true } },
      renterId: true,
      ownerId: true,
    },
  })

  let queued = 0
  for (const booking of bookings) {
    const notifications = await createRentalFlowNotifications(prisma, 'return_reminder', {
      bookingId: booking.id,
      bookingNo: booking.bookingNo,
      productName: booking.product.title,
      renterId: booking.renterId,
      ownerId: booking.ownerId,
    })
    for (const notification of notifications) {
      if (notification.created) queued += 1
      await deliverNotificationAfterCommit(notification.notification, notification.created)
    }
  }

  return NextResponse.json({ data: { bookings: bookings.length, queued } })
}

function utcDayStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}
