# Vercel production checklist

Manual steps for launching Code Format Tools at `https://codeformattertools.com`:

1. Buy `CodeFormatterTools.com`.
2. Add `codeformattertools.com` to the Vercel project.
3. Set `codeformattertools.com` as the primary production domain.
4. Add `www.codeformattertools.com`.
5. Configure a permanent hosting/domain redirect from `https://www.codeformattertools.com` to `https://codeformattertools.com`.
6. Verify HTTPS is active for both apex and `www`.
7. Configure production environment variables:
   - `NEXT_PUBLIC_SITE_URL=https://codeformattertools.com`
   - `NEXT_PUBLIC_CONTACT_EMAIL=`
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=`
   - `NEXT_PUBLIC_BING_SITE_VERIFICATION=`
8. Redeploy production after the domain and environment variables are set.
9. Test production headers on at least `/`, `/json-formatter`, `/sitemap.xml`, and `/robots.txt`.
10. Verify `https://codeformattertools.com/sitemap.xml`.
11. Verify `https://codeformattertools.com/robots.txt`.
12. Verify canonical URLs on the homepage and major tool pages.
13. Test all major tools: JSON, SQL, YAML, XML, CSV, and one converter.
14. Check the browser console for unexpected errors, worker failures, failed asset requests, or CSP violations.
15. Confirm Vercel Analytics and Speed Insights initialize after the dashboard toggles are enabled.
16. Confirm private editor data does not leave the browser by running a sentinel privacy test.

Do not mutate DNS or Vercel domain settings from source code. These are manual deployment operations.

Canonical host policy:

- Canonical: `https://codeformattertools.com`
- Redirect: `https://www.codeformattertools.com` to `https://codeformattertools.com`

AdSense remains disabled for this launch. Add ad-provider domains and scripts only after a separate provider review.
