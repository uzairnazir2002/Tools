import { expect, test } from "@playwright/test";

const productionOrigin = "https://codeformattertools.com";

test("production metadata, assets, sitemap, robots, and manifest are coherent", async ({ page, request }) => {
  const consoleProblems: string[] = [];
  page.on("console", message => {
    if (message.type() === "error") consoleProblems.push(message.text());
  });
  page.on("pageerror", error => consoleProblems.push(error.message));
  page.on("requestfailed", request => {
    const url = request.url();
    if (!url.includes("vitals.vercel-insights.com")) consoleProblems.push(`request failed: ${url}`);
  });

  const response = await page.goto("/json-formatter");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response?.headers()["content-security-policy"]).toContain("script-src-attr 'none'");
  expect(response?.headers()["content-security-policy"]).toContain("form-action 'self'");
  expect(response?.headers()["content-security-policy"]).not.toContain("unsafe-eval");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", `${productionOrigin}/json-formatter`);
  await expect(page.locator("meta[property='og:url']")).toHaveAttribute("content", `${productionOrigin}/json-formatter`);
  await expect(page.locator("meta[name='twitter:card']")).toHaveAttribute("content", "summary_large_image");

  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const manifestJson = await manifest.json();
  expect(manifestJson.name).toBe("Code Format Tools");
  expect(manifestJson.short_name).toBe("CodeFormatterTools");
  expect(manifestJson.icons.some((icon: { sizes?: string }) => icon.sizes === "192x192")).toBe(true);
  expect(manifestJson.icons.some((icon: { sizes?: string }) => icon.sizes === "512x512")).toBe(true);

  for (const asset of ["/icon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png", "/og-image.png"]) {
    const assetResponse = await request.get(asset);
    expect(assetResponse.ok()).toBe(true);
  }

  const sitemap = await request.get("/sitemap.xml");
  const sitemapText = await sitemap.text();
  expect(sitemapText).toContain(`${productionOrigin}/json-formatter`);
  expect(sitemapText).not.toContain("vercel.app");
  expect(sitemapText).not.toContain("codeformattools.com");

  const robots = await request.get("/robots.txt");
  const robotsText = await robots.text();
  expect(robotsText).toContain("Allow: /");
  expect(robotsText).toContain(`${productionOrigin}/sitemap.xml`);

  await page.getByRole("textbox", { name: "Input JSON" }).fill('{"ok":true}');
  await expect(page.locator(".output-pane .cm-content")).toContainText('"ok": true');
  await expect.poll(() => consoleProblems.filter(item => {
    if (/Failed to load resource: the server responded with a status of 404/.test(item)) return false;
    if (/127\.0\.0\.1:3101\/_vercel\/(?:insights|speed-insights)\/script\.js/.test(item)) return false;
    return true;
  })).toEqual([]);
});

test("file upload and download work in production build", async ({ page }) => {
  await page.goto("/json-formatter");
  await page.locator('input[type="file"]').setInputFiles({ name: "sample.json", mimeType: "application/json", buffer: Buffer.from('{"download":true}') });
  await expect(page.locator(".output-pane .cm-content")).toContainText('"download": true');
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  expect((await download).suggestedFilename()).toBe("json-formatter.json");
});
