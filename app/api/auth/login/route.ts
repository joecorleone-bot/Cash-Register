import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) return NextResponse.json({ ok: true, unprotected: true });

  const body = await request.json().catch(() => ({}));
  const password = String(body?.password ?? '');
  if (!password || password !== sitePassword) {
    return NextResponse.json({ error: 'Password tidak betul.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: await sessionToken(sitePassword),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}
