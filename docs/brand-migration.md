# Brand migration

The public brand changed from Formatbase to Code Format Tools.

Production identity:

- Name: Code Format Tools
- Short name: CodeFormatterTools
- Domain: `https://codeformattertools.com`
- Storage prefix: `codeformattools`

Backward compatibility:

- Browser preferences are migrated from legacy `formatbase.*` localStorage keys to `codeformattools.*` keys on first read.
- XML lossless conversion writes `codeformattools.xml.v1`.
- XML lossless conversion still accepts legacy `formatbase.xml.v1` envelopes so previously generated output can be restored.

No public UI, metadata, sitemap, robots, or structured data should use the old brand.
