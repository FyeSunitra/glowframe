import { NextRequest, NextResponse } from 'next/server'

import { completePhotoboothPayment, findPhotoboothPayment } from '@/lib/photoboothPayments'
import { getPhotoboothSessionId } from '@/lib/photoboothPaymentSession'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  const sessionId = await getPhotoboothSessionId()
  if (!sessionId) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  try {
    const payment = await findPhotoboothPayment(BigInt(id), sessionId)
    if (!payment || payment.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment is not available.' }, { status: 409 })
    }

    if (payment.completed_at) {
      return NextResponse.json({ data: { completedAt: payment.completed_at.toISOString() } })
    }

    const completed = await completePhotoboothPayment(BigInt(id), sessionId)
    if (!completed) {
      return NextResponse.json({ error: 'This Photobooth session has already been completed.' }, { status: 409 })
    }

    return NextResponse.json({ data: { completedAt: completed.completed_at.toISOString() } })
  } catch (error) {
    console.error('Failed to complete Photobooth payment session', error)
    return NextResponse.json({ error: 'Unable to complete the Photobooth session.' }, { status: 500 })
  }
}
