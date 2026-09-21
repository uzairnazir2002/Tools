# Independent Release-Candidate Audit

Date: 2026-09-21

Production brand: **Code Format Tools**  
Production origin: **https://codeformattertools.com**

## Result

Source architecture is consistent with the planned local-first formatter platform. The final repository independently reviewed here retains:

- 15 launch tools backed by reusable engines and a central registry
- precision-preserving JSON formatting/minification and duplicate-key diagnostics
- persistent Web Worker processing with stale-response rejection and recovery
- YAML safety limits and safe refusal of destructive comment-bearing formatting
- restricted XML entity/DOCTYPE handling
- CSV formula-injection protection
- privacy-safe analytics metadata and sentinel network tests
- SEO canonicals, sitemap, robots, structured data and legal/trust routes
- cross-browser and production-smoke test definitions

## Independent fixes applied

1. Canonical-origin hardening: a wrong `NEXT_PUBLIC_SITE_URL` can no longer redirect canonical generation away from `https://codeformattertools.com`.
2. Legacy preference migration precedence: `codeformattools.*` is preferred over the older `formatbase.*` namespace if both exist.
3. Added `script-src-attr 'none'` and `form-action 'self'` to CSP.
4. Added PNG social/install assets for Open Graph, Apple touch, and 192/512 manifest icons; SVG favicon remains.
5. Updated production-smoke/hardening tests for the above behavior.
6. Added a regression test proving a mistyped legacy domain cannot become the canonical origin.

## Residual launch note

Production CSP intentionally still uses `script-src 'unsafe-inline'` because the current Next.js rendering/runtime emits inline bootstrap/RSC scripts. `unsafe-eval` is disabled in production. A nonce/hash CSP would be a worthwhile later defense-in-depth project, but implementing it may require dynamic rendering/middleware changes and should not be rushed into this static SEO-heavy launch.

## Reproducibility limitation in this audit environment

Node.js is available, but the uploaded archive contains no installed dependencies and this environment does not provide pnpm/npm registry access. Therefore the full `pnpm install`, lint, typecheck, build, audit and Playwright suite could not be independently rerun here. The dependency-free SEO origin tests were run directly and pass. The repository includes Codex's prior green report for the full pipeline; production deployment should still rely on GitHub Actions / the developer machine to rerun all gates after these final changes.

## Required final gate outside this sandbox

Run:

```bash
pnpm install --frozen-lockfile
pnpm audit --audit-level high
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

If those remain green, connect the custom domain and execute `docs/vercel-production-checklist.md`.
