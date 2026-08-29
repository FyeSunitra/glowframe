import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

import { getCloudinary } from '@/lib/cloudinary'

const PREFIX = 'glowframe/photobooth/frames/'

export async function POST() {
  try {
    const { client, cloudName, apiKey, apiSecret } = getCloudinary()
    const timestamp = Math.floor(Date.now() / 1000)
    const folder = `${PREFIX}${randomUUID()}`
    const signature = client.utils.api_sign_request({ folder, timestamp }, apiSecret)
    return NextResponse.json({ data: { cloudName, apiKey, timestamp, folder, signature } })
  } catch (error) {
    console.error('Failed to create photobooth upload signature', error)
    return NextResponse.json({ error: 'Unable to prepare the frame upload.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const publicId = typeof body?.publicId === 'string' ? body.publicId : ''
    if (!publicId.startsWith(PREFIX)) {
      return NextResponse.json({ error: 'Invalid frame media.' }, { status: 400 })
    }
    const { client } = getCloudinary()
    await client.uploader.destroy(publicId, { resource_type: 'image', invalidate: true })
    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('Failed to remove photobooth media', error)
    return NextResponse.json({ error: 'Unable to remove frame media.' }, { status: 500 })
  }
}
