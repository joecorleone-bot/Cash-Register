import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD;

  // Keep the site usable until SITE_PASSWORD is configured in Vercel.
  if (!sitePassword) return NextResponse.next();

  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Basic ')) {
    try {
      const decoded = atob(authorization.slice(6));
      const separator = decoded.indexOf(':');
      const password = separator >= 0 ? decoded.slice(separator + 1) : '';
      if (password === sitePassword) return NextResponse.next();
    } catch {
      // Invalid Authorization header; show the login prompt below.
    }
  }

  return new NextResponse('Access restricted', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Squishy Toy POS", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
