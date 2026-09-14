import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, authEnabled, verifySessionToken } from '@/lib/auth';

const cashierAllowedDataActions = new Set(['checkout']);
const cashierAllowedToolActions = new Set(['apply-discount']);

export async function middleware(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/api/auth/');
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifySessionToken(session);

  if (isAuthRoute) {
    if (pathname === '/login' && user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user.role === 'cashier' && request.method === 'POST') {
    if (pathname === '/api/data' || pathname === '/api/transaction-tools') {
      const body = await request.clone().json().catch(() => ({}));
      const action = String(body?.action ?? '');
      const allowed = pathname === '/api/data'
        ? cashierAllowedDataActions.has(action)
        : cashierAllowedToolActions.has(action);

      if (!allowed) {
        return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-pos-user', user.username);
  response.headers.set('x-pos-role', user.role);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
