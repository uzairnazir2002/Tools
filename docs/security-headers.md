# Security headers

Security headers are configured centrally in `apps/web/next.config.ts`.

Configured headers:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `X-Frame-Options: DENY`

CSP summary:

- `default-src 'self'`
- `object-src 'none'`
- `base-uri 'self'`
- `frame-ancestors 'none'`
- `worker-src 'self' blob:`
- Vercel Analytics and Speed Insights are allowed for scripts and metrics connections.

The old custom inline theme initialization script was removed. The current production CSP still allows inline scripts
because the Next.js App Router production runtime emits inline bootstrap/RSC scripts. This is intentionally narrower
than a wildcard policy and does not allow `script-src *` or production `unsafe-eval`.

Development builds include `unsafe-eval` because React and Next.js use it for debugging features. Production builds do
not include it.

AdSense is not enabled. Ad provider domains should be added only during a later ad-provider review.
