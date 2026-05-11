// Next.js 16 renamed `middleware.ts` to `proxy.ts` — same hook, runs before each request.
// Used here as a soft access gate while the testing deploy is live.
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

export function proxy(request: NextRequest) {
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
