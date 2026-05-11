// Netlify Edge Function — HTTP Basic Auth gate for the testing deploy.
//
// Runs before the Next.js handler/static cache, so it gates every request
// (including cached pages, which is the gap that the Next.js middleware can't cover
// on Netlify). When SITE_PASSWORD is unset, this function is a no-op.

import type { Config, Context } from '@netlify/edge-functions';

const REALM = 'Route Runner — testing access';

export default async (request: Request, context: Context) => {
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

export const config: Config = {
  path: '/*',
};
