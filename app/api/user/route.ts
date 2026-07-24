import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // TODO: get user from Supabase session / Prisma
  return NextResponse.json({
    data: {
      displayName: 'You',
      fullName: '',
      email: 'you@example.com',
      phoneVerified: true,
      emailVerified: true,
      idVerified: false,
    },
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  // TODO: prisma.user.update({ where: { id: session.userId }, data: body })
  return NextResponse.json({ data: body, message: 'Profile updated' });
}
