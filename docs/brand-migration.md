# Brand migration

The public brand changed from Formatbase to Code Format Tools.

Production identity:

- Name: Code Format Tools
- Short name: CodeFormatterTools
- Domain: `https://codeformattertools.com`
- Storage prefix: `codeformattertools`

Backward compatibility:

- Browser preferences are migrated from legacy `formatbase.*` and `codeformattools.*` localStorage keys to `codeformattertools.*` keys on first read.
- XML lossless conversion writes `codeformattertools.xml.v1`.
- XML lossless conversion still accepts legacy `codeformattools.xml.v1` and `formatbase.xml.v1` envelopes so previously generated output can be restored.

No public UI, metadata, sitemap, robots, or structured data should use the old brand.
