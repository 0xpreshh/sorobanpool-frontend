import { NextResponse, type NextRequest } from 'next/server';

/**
 * Per-request Content Security Policy with a script nonce.
 *
 * Starts in report-only mode: violations are logged to the browser console and nothing is blocked.
 * Set `CSP_ENFORCE=1` to switch to enforcing. The nonce is passed to Next through the request's
 * `Content-Security-Policy` header, which lets Next add it to its own inline bootstrap scripts.
 */

const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').origin;
  } catch {
    return 'http://localhost:3000';
  }
})();

export function buildCsp(nonce: string, { dev }: { dev: boolean }): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    // Inline style attributes are used throughout; styles cannot run code, so this is the accepted trade-off.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${API_ORIGIN}`,
    `connect-src 'self' ${API_ORIGIN}${dev ? ' ws: wss:' : ''}`,
    "font-src 'self' data:",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const dev = process.env.NODE_ENV !== 'production';
  const csp = buildCsp(nonce, { dev });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const enforce = process.env.CSP_ENFORCE === '1';
  response.headers.set(enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only', csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
