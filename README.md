# Code Format Tools

Private browser based developer tools for formatting, validating, minifying, sorting, and converting structured data.

The production brand is **Code Format Tools** and the production origin is `https://codeformattertools.com`.

## Included

- Next.js 16 App Router site with static SEO content, sitemap, robots, Open Graph metadata, icons, and trust pages
- Shared tool registry and worker request/response types
- CodeMirror 6 input and output editors with accessible textbox names
- Browser worker processing with request IDs, stale-result protection, timeout handling, and worker crash recovery
- JSON formatter, validator, minifier, and key sorter
- SQL Formatter with twelve dialects, indentation, keyword case, and query spacing controls
- YAML formatter and validator with safety limits; comment-bearing YAML is not destructively reformatted
- XML formatter and validator with DOCTYPE blocking, no entity expansion, and depth and tag limits
- CSV parser and writer with row, column, malformed quote, uneven row, duplicate header, output, and formula escaping guards
- JSON/YAML/XML/CSV converters with explicit lossless, best effort, and compatibility modes where mappings can lose information
- Vercel Web Analytics and Speed Insights through a privacy-safe analytics abstraction

## Run

Requires Node.js 22 and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

## Environment

Required for production:

- `NEXT_PUBLIC_SITE_URL=https://codeformattertools.com`
- `NEXT_PUBLIC_CONTACT_EMAIL=<real support email>`

Optional verification values:

- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=`
- `NEXT_PUBLIC_BING_SITE_VERIFICATION=`

No secrets belong in public environment variables.

## Current limits

The editor accepts input up to 3 MB. Inputs above 1 MB require an explicit run. SQL formatting checks parseable syntax but cannot verify database semantics or execute queries. YAML validation supports comments, but YAML formatting currently refuses comment-bearing files rather than deleting comments. XML lossless conversion accepts both the current `codeformattools.xml.v1` envelope and the legacy `formatbase.xml.v1` envelope during the compatibility window. No account, database, input persistence, backend formatter endpoint, or ad script is present.
