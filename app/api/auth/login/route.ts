import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, authEnabled, authenticateUser, createSessionToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!authEnabled()) return NextResponse.json({ ok: true, unprotected: true, user: { username: 'local', role: 'admin' } });

  const body = await request.json().catch(() => ({}));
  const username = String(body?.username ?? '');
  const password = String(body?.password ?? '');
  const user = authenticateUser(username, password);

  if (!user) {
    return NextResponse.json({ error: 'Username atau password tidak betul.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionToken(user),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
