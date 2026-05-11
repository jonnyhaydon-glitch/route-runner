// Netlify Edge Function — HTTP Basic Auth gate for the testing deploy.
//
// Routing is declared in netlify.toml (which takes precedence over inline `config`
// per the Netlify docs and runs even on prerendered static routes that the Next.js
// adapter would otherwise serve via internal rewrite). When SITE_PASSWORD is unset
// (local dev, etc.) this function is a no-op.

import type { Context } from '@netlify/edge-functions';

const REALM = 'Route Runner — testing access';

export default async (request: Request, _context: Context) => {
  const expected = Netlify.env.get('SITE_PASSWORD');
  if (!expected) return; // gate disabled

  const header = request.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6).trim());
      const colon = decoded.indexOf(':');
      if (colon >= 0 && decoded.slice(colon + 1) === expected) {
        return; // authorized — pass through to Next.js
      }
    } catch {
      // fall through to challenge
    }
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': `Basic realm="${REALM}"` },
  });
};
