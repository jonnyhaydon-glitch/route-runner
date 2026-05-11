// Lightweight first-line-of-defence helpers for Claude-backed API routes.
//
// These don't replace proper rate limiting (which needs shared state, e.g. Upstash);
// they raise the bar against drive-by browser abuse and accidental prompt injection.

const PROD_HOSTS = new Set<string>();
function allowedHosts(): Set<string> {
  if (PROD_HOSTS.size > 0) return PROD_HOSTS;
  for (const env of ['URL', 'DEPLOY_PRIME_URL', 'DEPLOY_URL', 'NEXT_PUBLIC_SITE_URL']) {
    const v = process.env[env];
    if (!v) continue;
    try {
      PROD_HOSTS.add(new URL(v).host);
    } catch {
      // ignore malformed
    }
  }
  return PROD_HOSTS;
}

export function isOriginAllowed(request: Request): boolean {
  // Always allow local dev.
  if (process.env.NODE_ENV !== 'production') return true;
  const allow = allowedHosts();
  if (allow.size === 0) return true; // no env configured → don't block

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (allow.has(new URL(origin).host)) return true;
    } catch {
      // fall through
    }
  }
  // Some browsers omit Origin on same-site GET/POST; fall back to Referer.
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      if (allow.has(new URL(referer).host)) return true;
    } catch {
      // fall through
    }
  }
  return false;
}

export function sanitizeUserText(s: unknown, maxLen: number): string {
  if (typeof s !== 'string') return '';
  // Collapse all whitespace (including newlines and tabs) to single spaces.
  // Newline injection is the primary lever for "ignore previous instructions"-style prompts.
  return s.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}
