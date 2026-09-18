# Formatbase

Private browser based developer tools. This repository contains the completed Phase 0 foundation, Phase 1 JSON tools, Phase 2 SQL Formatter, Phase 3 YAML tools, Phase 4 XML tools, Phase 5 CSV and conversion tools, Phase 6 launch SEO, Phase 7 legal/trust pages, and Phase 8 analytics/operations wiring. See [PHASES.md](./PHASES.md) for the phase checklist and acceptance record.

## Included

- Next.js 16 App Router site with static HTML, per tool metadata, sitemap, and trust pages
- Shared tool registry and worker request/response types
- Typed analytics interface that is disabled until a provider is deliberately configured
- CodeMirror 6 input and output editors
- Lazy editor language modes for JSON, SQL, YAML, and XML; persisted light/dark/system theme
- Browser worker processing with latest request handling and cancellation by worker termination
- JSON formatter, validator, minifier, and key sorter
- SQL Formatter with twelve dialects, indentation, keyword case, and query spacing controls
- YAML formatter and validator with bounded depth, aliases, merge keys, documents, expanded nodes, and line length
- XML formatter and validator with DOCTYPE blocking, no entity expansion, and depth and tag limits
- CSV parser and writer with row, column, malformed quote, uneven row, duplicate header, output, and formula escaping guards
- JSON to YAML, YAML to JSON, JSON to CSV, CSV to JSON, JSON to XML, and XML to JSON converters
- Conversion modes for lossless, best effort, and compatibility behavior where mappings can lose information
- Lossless numeric text handling and duplicate key warnings using a Momoa AST
- Upload, copy, download, reset, indentation preference, and `Ctrl/⌘ + Enter`

## Run

Requires Node.js 22 and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm lint
pnpm e2e
```

Set `NEXT_PUBLIC_SITE_URL` to the production origin before deployment so canonical URLs and the sitemap point to the correct site. The current Vercel production origin is `https://tools-web-ten-ruddy.vercel.app`.
Set `NEXT_PUBLIC_CONTACT_EMAIL` so the Contact page shows a real support address. The current Vercel production deployment has a contact mailto link configured. The candidate custom domain is `formatvalidateconvert.com`, but it is not treated as the production origin until it is purchased and configured.
Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` and `NEXT_PUBLIC_BING_SITE_VERIFICATION` when Search Console and Bing Webmaster provide verification tokens. The current Vercel production deployment has both verification tags configured.
Browser tests use Playwright Chromium. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a local Chrome/Chromium executable, or run `pnpm exec playwright install chromium`.

## Current limits

The editor accepts input up to 3 MB. Inputs above 1 MB require an explicit run. This is a guarded limit, not a performance claim. SQL formatting checks parseable syntax but cannot verify database semantics or execute queries. YAML formatting retains numeric scalar text and anchors but removes comments; the validator leaves input untouched. XML formatting keeps mixed content and xml:space=preserve sources unchanged to protect text spacing. Conversion tools expose lossless, best effort, and compatibility modes where data models differ. CSV cells are kept as text in lossless mode, and formula-like output cells are escaped. Large file streaming belongs to a later phase of the brief. Vercel Web Analytics and Speed Insights are configured for page views, tool events, related-tool clicks, and Core Web Vitals without raw input or output capture. No account, database, input persistence, or ad script is present.
