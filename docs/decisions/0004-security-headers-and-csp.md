# 0004 Security headers and Content Security Policy

**Status:** accepted. The CSP starts in report-only mode.

**Context.** The app had no security headers and no Content Security Policy. Users type text that other people see (display names, product titles, hub addresses, dispute notes). Photos are taken from the camera on a few routes.

**Decision.**

*Content Security Policy* (`proxy.ts`). Each request gets a fresh nonce. The policy:

- `script-src 'self' 'nonce-…' 'strict-dynamic'`, with `'unsafe-eval'` in development only (Next's dev tooling needs it).
- `style-src 'self' 'unsafe-inline'`. Styles cannot run code, and the app uses inline `style` props for progress bars.
- `connect-src` and `img-src` allow only the API origin from `NEXT_PUBLIC_API_URL`. Uploads go to the same origin, so no separate bucket origin is needed.
- `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.

The policy is sent as `Content-Security-Policy-Report-Only` by default. Violations appear in the browser console, and nothing is blocked. Set `CSP_ENFORCE=1` to enforce it. Enforce only after the core pages (home, pool, onboarding) show no violations.

*Other headers* (`next.config.ts`), applied to every route:

| Header | Value | Why |
| --- | --- | --- |
| `X-Content-Type-Options` | `nosniff` | Stops browsers guessing a type for uploaded files. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits how much of a URL third parties see. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates the window from cross-origin openers. |
| `X-Frame-Options` | `DENY` | Frame protection for browsers that ignore `frame-ancestors`. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Disables features the app does not use. |

*Camera.* The camera is allowed only on routes that take a photo: `/organize/:id/delivery`, `/supplier/offers/new` and `/pools/:id` (where the dispute form lives). Those routes get `camera=(self)`, listed after the global rule so it takes precedence.

**Consequences.**

- Pages that use a nonce are rendered per request, so they can no longer be fully static.
- `style-src 'unsafe-inline'` is a deliberate concession. The CSP does not stop injected inline styles.
- The `Permissions-Policy` override depends on how Next orders matching header rules. Check the header on `/pools/:id` and on a non-evidence route after the first deploy.
- Enforcing the CSP will break any future inline script that does not use the nonce. That is intended.
