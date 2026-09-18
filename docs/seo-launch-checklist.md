# SEO launch checklist

Manual steps for the production domain:

1. Connect `codeformattertools.com` to Vercel.
2. Verify HTTPS.
3. Redirect `https://www.codeformattertools.com` to `https://codeformattertools.com`.
4. Verify canonical URLs use `https://codeformattertools.com`.
5. Verify `https://codeformattertools.com/robots.txt`.
6. Verify `https://codeformattertools.com/sitemap.xml`.
7. Create a Google Search Console domain property.
8. Verify ownership.
9. Submit the sitemap.
10. Inspect the homepage.
11. Inspect key tool routes such as `/json-formatter`, `/sql-formatter`, `/yaml-formatter`, and `/xml-formatter`.
12. Configure Bing Webmaster Tools.
13. Monitor coverage and indexing.
14. Do not submit Vercel preview domains.

Canonical host strategy:

- Canonical: `https://codeformattertools.com`
- Redirect: `https://www.codeformattertools.com` to `https://codeformattertools.com`

DNS and redirect configuration are deployment/domain tasks, not source-code changes.
