import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  // TODO: real Supabase auth — supabase.auth.signInWithPassword({ email, password })
  return NextResponse.json({
    data: {
      user: { email, displayName: 'You', idVerified: false },
      token: 'mock-token-login',
    },
    message: 'เข้าสู่ระบบสำเร็จ',
  });
}
