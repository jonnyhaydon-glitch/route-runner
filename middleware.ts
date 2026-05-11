// Soft access gate while the testing deploy is live.
//
// Note on naming: Next.js 16 renamed `middleware.ts` to `proxy.ts`. Both still work as of
// 16.2 (the runtime accepts either filename), but Netlify's Next.js adapter only picks up
// `middleware.ts` currently — so we keep that name until the adapter ships proxy.ts support.
//
// When SITE_PASSWORD is set, every request must include HTTP Basic credentials whose
// password matches. The browser will surface a native login dialog and remember the
// answer for the session. When SITE_PASSWORD is unset (e.g. local dev), the gate is off.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REALM = 'Route Runner — testing access';

function challenge() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${REALM}"` },
  });
}

export function middleware(request: NextRequest) {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) return NextResponse.next();

  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) return challenge();

  const encoded = header.slice('Basic '.length).trim();
  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return challenge();
  }
  const colon = decoded.indexOf(':');
  if (colon === -1) return challenge();
  const password = decoded.slice(colon + 1);
  if (password !== expected) return challenge();

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|__nextjs_).*)'],
};
