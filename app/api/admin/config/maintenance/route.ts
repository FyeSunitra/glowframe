import { NextRequest, NextResponse } from 'next/server'

let MAINTENANCE = {
  enabled: false,
  message: "We're performing scheduled maintenance. We'll be back shortly.",
  estimatedDate: '',
  estimatedTime: '',
  ipWhitelist: '127.0.0.1',
}

export async function GET() {
  return NextResponse.json({ data: MAINTENANCE })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  MAINTENANCE = { ...MAINTENANCE, ...body }
  return NextResponse.json({ data: MAINTENANCE })
}
