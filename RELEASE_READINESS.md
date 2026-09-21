# Release readiness

Date: 2026-09-19

## Brand and domain

- Brand: Code Format Tools
- Compact identifier: CodeFormatterTools
- Production domain: `https://codeformattertools.com`
- Canonical host: `https://codeformattertools.com`
- Redirect policy: `https://www.codeformattertools.com` must permanently redirect to `https://codeformattertools.com` at the hosting/domain layer.

## Release verdict

READY for domain connection and production deployment after the manual Vercel/domain steps are completed.

## Build status

PASS

- `pnpm build`
- Next.js production build completed.
- Static generation produced 31 app routes, including homepage, 15 tool routes, six category routes, legal/trust pages, manifest, sitemap, and robots.

## Lint status

PASS

- `pnpm lint`

## TypeScript status

PASS

- `pnpm typecheck`

## Unit-test status

PASS

- `pnpm test`
- Package tests covered JSON, SQL, YAML, XML, CSV, conversion, worker runtime, SEO origin handling, registry validation, and download MIME types.

## E2E status

PASS

- `pnpm e2e`
- Result: 56 passed.

## Browser results

- Chromium: PASS
- Firefox smoke: PASS
- WebKit smoke: PASS

Cross-browser smoke covers homepage, JSON Formatter, JSON Validator, JSON Minifier, JSON Sorter, SQL Formatter, YAML Formatter, XML Formatter, one converter, About, Privacy, Contact, mobile layout, and tablet layout.

## Dependency audit status

PASS

- `pnpm audit --audit-level high`
- Result: no known high or critical vulnerabilities.

## Security-header status

PASS

Production response headers verified by browser tests:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `frame-ancestors 'none'`
- `X-Frame-Options: DENY`

Production CSP does not include `unsafe-eval`. Development CSP includes `unsafe-eval` for React/Next debugging only.

## Privacy sentinel status

PASS

Browser request interception verified that `CODEFORMATTERTOOLS_PRIVATE_SENTINEL_987654321` does not appear in outgoing request URLs, query strings, request bodies, or observable analytics payloads for:

- JSON Formatter
- SQL Formatter
- YAML Formatter
- XML Formatter

Additional privacy tests cover conversion routes and analytics URL redaction.

## Worker status

PASS

Verified:

- request IDs
- stale-response protection
- worker timeout handling
- persistent worker reuse through repeated operations
- worker cleanup on page lifecycle through ToolShell unmount behavior
- worker error handling
- worker recreation after a simulated `postMessage` failure

## SEO status

PASS

Verified:

- all 15 tool pages have unique title and description
- one clear H1 per tool route
- canonical URLs use `https://codeformattertools.com`
- breadcrumbs
- examples
- common errors
- FAQ
- related tools
- WebApplication, BreadcrumbList, FAQPage structured data
- homepage WebSite and Organization structured data
- sitemap and robots point to the final domain
- Open Graph and Twitter metadata are present

## Manifest and icons

PASS

Manifest values:

- `name`: Code Format Tools
- `short_name`: CodeFormatterTools
- `start_url`: `/`

Icon dimensions checked:

- `/icon.svg`: 128 × 128
- `/apple-touch-icon.png`: 180 × 180
- `/icon-192.png`: 192 × 192
- `/icon-512.png`: 512 × 512
- `/og-image.png`: 1200 × 630

## Performance observations

JSON formatter benchmark on this Windows development machine:

| Input tier | Input bytes | Output bytes | Duration | RSS |
| --- | ---: | ---: | ---: | ---: |
| 1 KB | 987 | 1,396 | 5 ms | 56 MB |
| 100 KB | 99,993 | 141,370 | 52 ms | 71 MB |
| 1 MB | 999,979 | 1,413,764 | 266 ms | 145 MB |
| 3 MB | 2,999,993 | 4,241,370 | 576 ms | 315 MB |
| 5 MB reference only | 4,999,949 | 7,068,894 | 1,318 ms | 381 MB |

Homepage script transfer measured in browser E2E: 275,895 bytes, below the 500 KB budget.

## Known limitations

- YAML formatting refuses real comment-bearing YAML instead of silently deleting comments. YAML validation supports comments.
- SQL formatting is syntax formatting only; it does not prove database semantics.
- Input size is intentionally bounded by the browser ToolShell. Streaming huge-file support is not part of this launch.
- Vercel Analytics and Speed Insights script endpoints are fully available only in Vercel production. Local `next start` may show local `_vercel` script MIME warnings; tests filter only those known local-only warnings.
- No accounts, backend formatter endpoint, database, API product, Redis, cloud storage, AI functionality, or AdSense integration is enabled.

## Required manual Vercel/domain steps

See `docs/vercel-production-checklist.md`.

Required summary:

1. Buy `CodeFormatterTools.com`.
2. Add `codeformattertools.com` to Vercel.
3. Set `codeformattertools.com` as primary.
4. Add `www.codeformattertools.com`.
5. Redirect `www` to apex permanently.
6. Verify HTTPS.
7. Configure production environment variables.
8. Redeploy.
9. Verify headers, sitemap, robots, canonicals, tools, console cleanliness, analytics, and privacy sentinel behavior.

## Required environment variables

```env
NEXT_PUBLIC_SITE_URL=https://codeformattertools.com
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_BING_SITE_VERIFICATION=
```

`NEXT_PUBLIC_CONTACT_EMAIL` is required for production contact readiness. The app does not invent a fallback email address.

## SEO launch steps

1. Create Google Search Console property for `codeformattertools.com`.
2. Verify ownership.
3. Submit `https://codeformattertools.com/sitemap.xml`.
4. Inspect homepage and key tool URLs.
5. Create or connect Bing Webmaster Tools property.
6. Submit the sitemap.
7. Do not submit Vercel preview domains.

## AdSense status

NOT ENABLED

Current source has no AdSense script, no ad network calls, no clickable empty ad placeholder, and no ad slot near Run/Copy/Download controls.

## Final domain scan summary

- `codeformattertools.com`: present only as final domain in config, docs, tests, metadata assets, and environment examples.
- `codeformattools.com`: absent.
- `formatvalidateconvert`: absent.
- `tools-web-ten-ruddy`: absent.
- `vercel.app`: present only in tests that prove preview URLs are not used as canonical production origin.
- `formatbase`: present only in migration compatibility code, migration docs, and tests.
- `codeformattools`: present as internal workspace package namespace and legacy compatibility namespace, not as a public canonical domain.

## Intentionally deferred

- DNS/domain connection.
- Production Vercel environment variable setup.
- Search Console and Bing property verification.
- Ad provider review and revenue monitoring.
- Future premium/API/database/large-file features.

## Recommended first task after launch

After the domain is connected and production is redeployed, run the Vercel production checklist end to end and submit the sitemap to Google Search Console and Bing Webmaster Tools.


## Independent post-Codex hardening note

A final independent source audit added two CSP directives that are safe for the current static/local-first architecture:

- `script-src-attr 'none'`
- `form-action 'self'`

The production `script-src` still contains `'unsafe-inline'` because Next.js emits inline bootstrap/RSC scripts. Removing it safely would require a nonce/hash architecture and should be treated as a future defense-in-depth task rather than a launch blocker. `unsafe-eval` remains excluded from production.

Social/install assets now use PNG for broad crawler/iOS compatibility, while the SVG favicon remains available. Canonical origin generation also refuses a mistyped `NEXT_PUBLIC_SITE_URL` and falls back to the fixed production origin `https://codeformattertools.com`.
