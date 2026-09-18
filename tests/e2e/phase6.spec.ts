import { expect, test } from "@playwright/test";
import { categories, tools } from "@codeformattools/tool-registry";

test("all tool pages expose unique SEO sections and structured data", async ({ page }) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const tool of tools) {
    await page.goto(`/${tool.slug}`);
    await expect(page).toHaveTitle(tool.seo.title);
    await expect(page.locator("meta[name='description']")).toHaveAttribute("content", tool.seo.description);
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", new RegExp(`/${tool.slug}$`));
    await expect(page.getByRole("heading", { name: `${tool.name}.` })).toBeVisible();
    await expect(page.getByText(tool.about)).toBeVisible();
    await expect(page.locator(".example-code")).toContainText(tool.example.split("\n")[0]);
    for (const item of tool.commonErrors) await expect(page.locator(".error-grid strong").getByText(item.title, { exact: true })).toBeVisible();
    for (const item of tool.faq) await expect(page.locator(".faq-list summary").getByText(item.question, { exact: true })).toBeVisible();
    for (const related of tool.relatedTools) await expect(page.locator(".related").getByRole("link", { name: new RegExp(related.replace(/-/g, ".*"), "i") })).toBeVisible();

    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent || "{}")));
    expect(schemas.some(schema => schema["@type"] === "WebApplication" && schema.name === tool.name)).toBe(true);
    expect(schemas.some(schema => schema["@type"] === "BreadcrumbList" && schema.itemListElement.length === 3)).toBe(true);
    expect(schemas.some(schema => schema["@type"] === "FAQPage" && schema.mainEntity.length === tool.faq.length)).toBe(true);
    titles.add(await page.title());
    descriptions.add(await page.locator("meta[name='description']").getAttribute("content") || "");
  }
  expect(titles.size).toBe(tools.length);
  expect(descriptions.size).toBe(tools.length);
});

test("sitemap, robots, category navigation, and page budget are launch ready", async ({ page, request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  for (const tool of tools) expect(sitemapText).toContain(`/${tool.slug}`);
  for (const category of categories) expect(sitemapText).toContain(`/tools/${category.id}`);

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Allow: /");
  expect(robotsText).toContain("Sitemap:");

  for (const category of categories) {
    await page.goto(`/tools/${category.id}`);
    await expect(page).toHaveTitle(`${category.name} | Code Format Tools`);
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", new RegExp(`/tools/${category.id}$`));
    for (const tool of tools.filter(item => item.category === category.id)) await expect(page.getByRole("link", { name: new RegExp(tool.name) })).toBeVisible();
  }

  await page.goto("/json-to-yaml");
  await page.waitForLoadState("networkidle");
  const transferred = await page.evaluate(() => performance.getEntriesByType("resource").filter(entry => entry.initiatorType === "script").reduce((sum, entry) => sum + ((entry as PerformanceResourceTiming).transferSize || 0), 0));
  expect(transferred).toBeLessThan(1_200_000);
});
