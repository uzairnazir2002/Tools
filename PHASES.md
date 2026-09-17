# Implementation phases and acceptance record

The product brief is the source of truth. Work proceeds in phase order. A phase is complete only after its checklist and end-to-end verification pass. The existing JSON prototype remains available while the foundation is generalized.

## Phase 0 — foundation: complete and verified

- [x] pnpm/Turborepo monorepo with isolated web, core, registry, editor, worker runtime, JSON engine, SEO, and analytics packages.
- [x] Tool registry with identity, category, engine, operations, input/output language and extensions, configurable options, related tools, SEO fields, privacy mode, and worker identifier. Registry validation rejects duplicate routes and invalid references. Category navigation is generated from registry data.
- [x] Shared ToolShell renders options, file controls, input/output, diagnostics, status, and metrics from a tool definition.
- [x] CodeMirror 6 editor package with lazy JSON, SQL, YAML, and XML language support and plain text fallback.
- [x] Typed worker request/response protocol with request IDs, engine/action validation, lazy engine dispatch, metrics, immediate stale-result invalidation, worker termination, and a timeout.
- [x] Shared diagnostics with severity, code, message, line/column, offsets, and suggestion; CodeMirror markers and UI messages consume them.
- [x] Typed, privacy-safe analytics interface with a disabled provider; no raw input/output field.
- [x] SEO metadata package, unique tool metadata, canonical paths, WebApplication and BreadcrumbList JSON-LD, sitemap, and robots.txt.
- [x] Central CSS tokens for color and typography, responsive layout, and persisted light/dark/system theme.
- [x] Local verification: lint, typecheck, unit tests, build, browser E2E, and dependency audit.
- [x] CI workflow repeats the verification gate; Dependabot opens reviewable dependency PRs.
- [x] Homepage initial script transfer has a 500 KB browser-test budget; measured locally at 272 KB in Chromium. Tool parsers are loaded on demand.

The first release keeps processing entirely in the browser. `NEXT_PUBLIC_SITE_URL` must be set to the real origin before deployment. The local fallback is `http://localhost:3000`.

Verification on 2026-09-17: lint and strict TypeScript passed; 12 unit tests passed; production build generated the homepage, four tool routes, and JSON category route; six Chromium browser tests passed; the dependency audit found no known vulnerabilities. The browser test measured 271,517 bytes of initial homepage script transfer against a 500,000-byte budget. The phase was reviewed against every item in section 52 of the brief before proceeding.

## Phase 1 — JSON reference implementation: complete and verified

- [x] Audit JSON Formatter, Validator, Minifier, and Sorter against valid, malformed, deeply nested, and large input.
- [x] Source-location diagnostics, bounded source excerpts, and a deterministic trailing-comma correction.
- [x] Paste, open-file, copy, download, reset, indentation, keyboard, mobile, and privacy behavior verified in Chromium.
- [x] Large numeric literals and duplicate keys preserved across applicable actions; warnings identify duplicates.
- [x] JSON fixtures for simple, nested, Unicode, emoji, huge numbers, duplicates, malformed syntax, deep nesting, and large arrays.
- [x] Idempotency, six golden outputs, 100 generated-structure cases, and browser flows.
- [x] Measured input tiers and safety limits: automatic below 1 MB, explicit run from 1 to 3 MB, rejection above 3 MB, 512 nesting levels, 12 million formatted characters, and a 20-second worker timeout.
- [x] ToolShell contract reviewed and frozen for the first four tools; later engines use registry metadata and the shared request/diagnostic protocol.

Verification on 2026-09-17: lint and strict TypeScript passed; 28 unit tests passed; production build passed; 13 Chromium browser tests passed; the dependency audit found no known vulnerabilities. The browser suite includes a 1.1 MB guarded-file flow, over-limit rejection, mobile sorter layout, file/copy/download/reset actions, preference persistence, privacy request inspection, and a one-click syntax fix. Node benchmarks on this machine measured about 58 ms at 100 KB, 332 ms at 1 MB, 585 ms at 3 MB, and 1,151 ms at 5 MB; the 5 MB case reached about 383 MB process RSS. These are local observations, not a browser performance guarantee.

## Phase 2 — SQL: complete and verified

- [x] SQL engine loaded only for SQL requests through the shared worker; formatter page and SQL category route are generated from the registry.
- [x] All twelve planned dialects: Standard SQL, PostgreSQL, MySQL, MariaDB, SQL Server, SQLite, BigQuery, Snowflake, Oracle PL/SQL, Redshift, DuckDB, and ClickHouse.
- [x] Indentation (2 spaces, 4 spaces, tab), keyword case (uppercase, lowercase, preserve), and query spacing (1, 2, 3 lines) work and persist per tool.
- [x] Comments and dialect-appropriate positional, named, and numbered placeholders survive formatting. Unclosed syntax produces a line and column diagnostic with source context. SQL formatting does not verify database semantics.
- [x] SQL fixtures cover all twelve dialects plus CTEs, window functions, subqueries, comments, placeholders, and malformed input. Seventeen checked-in golden outputs and idempotency checks detect formatter changes.
- [x] Browser flows cover the SQL page, options, saved preferences, open-file, copy, download, reset, diagnostics, SQL category, mobile layout, and network privacy.

Verification on 2026-09-17: frozen-lockfile install, lint, strict TypeScript, unit tests, production build, and dependency audit passed with no known vulnerabilities. The complete Chromium suite passed 18 tests, including five SQL flows. The homepage initial script transfer remained 272,008 bytes against the 500,000-byte budget. The SQL engine has 21 unit tests and the worker runtime has a direct SQL routing test. The phase was reviewed against every Phase 2 item and the SQL fixture and formatter sections of the brief before proceeding.
## Phase 3 — YAML: complete and verified

- [x] YAML Formatter and YAML Validator use a dedicated lazy engine in the shared browser worker, with registry pages and category navigation.
- [x] Pinned js-yaml 5.4.2 with explicit limits: 64 nesting levels, 32 aliases, 2,000 merged keys, 100,000 expanded nodes, 20 documents, one million characters per line, and 12 million output characters; the shared editor also limits input to 3 MB and worker time to 20 seconds.
- [x] Formatter preserves numeric scalar text and anchor names through the syntax tree, supports multi-document streams, and warns that comments may be removed. Validator leaves input unchanged.
- [x] Source-location diagnostics for malformed YAML and errors for safety limits.
- [x] Fixtures for simple, Unicode, multiple documents, aliases, merges, malformed syntax, deep nesting, alias and merge limit attacks, recursive aliases, and a large scalar. Five golden outputs, idempotency checks, and 100 generated malformed inputs.
- [x] Browser tests cover formatter output and options, comment warning, validator diagnostics, recursive alias rejection, category, file input, mobile layout, and request privacy.

Verification on 2026-09-17: lint, strict TypeScript, 16 YAML engine tests, worker routing tests, frozen-lockfile install, production build, dependency audit with no known vulnerabilities, and the complete 22-test Chromium browser suite passed. A 3-million-character scalar exposed parser stack exhaustion during the audit; a line-length guard now rejects it before parsing. Local Node timing was about 21 ms for a 100 KB scalar and 72 ms for a 1 MB scalar before the guard; these are local observations, not browser guarantees. The phase was reviewed against the YAML safety and Phase 3 sections of the brief before proceeding.
## Phase 4 — XML: complete and verified

- [x] XML Formatter and XML Validator use a dedicated lazy engine in the shared browser worker, with registry pages and category navigation.
- [x] Pinned fast-xml-parser 5.11.1; DOCTYPE and other declarations are rejected before parsing, and entity expansion is disabled. Only standard and bounded numeric entity references are accepted; external and custom entities are blocked.
- [x] Safety guards reject excessive nesting (128 levels), tags (100,000), tag and attribute length (100,000 characters), entity references (10,000), and output length (12 million characters); the shared 3 MB input and 20-second worker limits also apply.
- [x] Formatter retains attributes, namespaces, comments, CDATA, and entity text. Mixed content and xml:space=preserve sources are left unchanged with a warning to protect meaningful whitespace. Validator leaves input unchanged.
- [x] Fixtures cover ordinary XML, DOCTYPE, entity expansion, deep nesting, oversized attributes, comments, CDATA, namespaces, malformed syntax, and mixed content. Four golden outputs, idempotency checks, and 100 generated malformed inputs detect regressions.
- [x] Browser tests cover formatting, indentation, syntax locations, DOCTYPE rejection, category navigation, mobile file input, and request privacy.

Verification on 2026-09-18: frozen-lockfile install, lint, strict TypeScript, unit tests, production build, dependency audit with no known vulnerabilities, and the complete 26-test Chromium browser suite passed. The XML engine had 12 unit tests at the full-suite run; one additional xml:space=preserve regression test was added afterward and passed locally. The homepage initial script transfer remained 272,007 bytes against the 500,000-byte budget. The phase was reviewed against the XML security, fixture, and Phase 4 sections of the brief before proceeding.
## Phase 5 — conversions and CSV: complete and verified

- [x] CSV engine and JSON ↔ YAML, JSON ↔ CSV, JSON ↔ XML tools are routed through the shared lazy worker and generated from registry metadata.
- [x] Canonical representation preserves numeric lexical text and duplicate-key structure where the source model supports it.
- [x] Lossless, best effort, and compatibility modes are exposed where relevant, with diagnostics for aliases, merges, XML mapping loss, CSV type inference, nested CSV values, and formula-like cells.
- [x] CSV parsing and writing enforce row, column, malformed quote, uneven row, duplicate header, output length, and formula escaping safeguards.
- [x] Conversion fixtures, golden outputs, generated round-trip/property tests, worker routing tests, and browser flows cover all six conversion directions.

Verification on 2026-09-18: frozen-lockfile install, lint, strict TypeScript, unit tests, production build, dependency audit with no known vulnerabilities, and the complete 32-test Chromium browser suite passed. Phase 5 added six converter pages for a total of 15 tool routes and six registry categories. CSV engine tests, conversion-engine tests, generated JSON/YAML round trips, golden outputs, worker runtime routing, file/download/mobile behavior, mode diagnostics, formula escaping, and request privacy were reviewed against the conversion and CSV sections of the brief before proceeding.

## Phase 6 — launch SEO: in-repo SEO layer verified, external webmaster setup pending

- [x] Reviewed all 15 tool pages for unique titles, descriptions, examples, common errors, FAQs, related links, breadcrumbs, and structured data.
- [x] Added FAQPage structured data alongside WebApplication and BreadcrumbList JSON-LD.
- [x] Added registry tests that enforce unique SEO titles, descriptions, examples, common-error sections, FAQ sections, required page content, and related links.
- [x] Added browser tests for all tool metadata, canonical URLs, H1s, examples, common errors, FAQs, related links, JSON-LD, sitemap, robots, category navigation, and a tool-page script budget.
- [ ] Configure Search Console and Bing Webmaster after a production origin and verification method are available.

Verification on 2026-09-18: lint, strict TypeScript, unit tests, production build, the Phase 6 Chromium browser suite, and the complete 34-test Chromium browser suite passed. The production build generated 29 static pages, including 15 tool routes and six category routes. The sitemap includes every tool and category route, robots.txt allows indexing and points to the sitemap, canonical links resolve to each route, and the tested tool-page script transfer stayed below the 1.2 MB Phase 6 browser budget. Search Console and Bing Webmaster remain external setup work because they require the real production origin and account verification.

## Phase 7 — legal, trust, and monetization readiness: local readiness verified, production contact pending

- [x] Expanded About, Privacy, and Terms pages with launch-ready trust, privacy, local-processing, preference-storage, accuracy, and availability copy.
- [x] Added a Contact page and footer link. The page is ready for a real address through `NEXT_PUBLIC_CONTACT_EMAIL`.
- [x] Recorded candidate domain `formatvalidateconvert.com` in site config for the pending contact/domain setup.
- [x] Confirmed the current deployment has no analytics cookies, advertising cookies, account system, third-party analytics script, or ad provider script, so no consent banner is present at this stage.
- [x] Added disabled ad-reservation regions below the interactive tool workspace, with reserved layout space and no provider script loading.
- [ ] Configure a real production contact email after the domain is purchased and mail is configured.

Verification on 2026-09-18: lint, strict TypeScript, unit tests, production build, dependency audit with no known vulnerabilities, the Phase 7 Chromium browser suite, and the complete 36-test Chromium browser suite passed. The production build generated 30 static pages after adding `/contact`. Browser checks verified About, Privacy, Terms, Contact, footer links, sitemap inclusion, disabled ad regions, reserved ad layout space, and absence of common ad and analytics provider requests. A real contact channel remains external setup work because the domain has not been purchased yet.

## Phase 8 — analytics and operations

- [ ] Choose and connect a privacy-conscious provider without input/output capture.
- [ ] Measure successful executions, starts, errors, related-tool use, repeat visits, organic search metrics, Core Web Vitals, and later revenue.
- [ ] Establish dependency review, security/fixture/performance gates, preview deployment, smoke tests, and production monitoring.

Future premium accounts, API service, Postgres, Redis, OPFS large-file mode, additional utilities, and ads remain outside the initial launch scope unless a later phase explicitly calls for them.
