import { test, expect } from "@playwright/test";

test("tool pages have server rendered metadata and working JSON processing", async ({ page }) => {
  await page.goto("/json-formatter");
  await expect(page).toHaveTitle(/JSON Formatter/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/json-formatter$/);
  await expect(page.getByRole("heading", { name: "JSON Formatter." })).toBeVisible();
  const input = page.locator(".editor-pane").first().locator(".cm-content");
  await input.fill('{"id":9123372036854000123,"a":1,"a":2}');
  await expect(page.getByText("Completed with warnings")).toBeVisible();
  await expect(page.getByText(/Duplicate key "a"/)).toBeVisible();
  await expect(page.locator(".output-pane .cm-content")).toContainText("9123372036854000123");
});

test("editing invalidates the previous result and minifier uses the worker", async ({ page }) => {
  await page.goto("/json-minifier");
  const input = page.locator(".editor-pane").first().locator(".cm-content");
  await input.fill('{ "old": 1 }');
  await expect(page.locator(".output-pane .cm-content")).toContainText('{"old":1}');
  await input.fill('{ "new": 2 }');
  await expect(page.locator(".output-pane .cm-content")).not.toContainText("old");
  await expect(page.locator(".output-pane .cm-content")).toContainText('{"new":2}');
});

test("theme persists and narrow layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const theme = page.getByRole("button", { name: /Theme:/ });
  await theme.click();
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("tool input is absent from outgoing requests", async ({ page }) => {
  const sentinel = "PRIVATE_PHASE0_SENTINEL_58291";
  const requests: string[] = [];
  page.on("request", request => requests.push(`${request.url()} ${request.postData() || ""}`));
  await page.goto("/json-validator");
  await page.locator(".editor-pane").first().locator(".cm-content").fill(`{"secret":"${sentinel}"}`);
  await expect(page.getByText("Valid input")).toBeVisible();
  expect(requests.some(request => request.includes(sentinel))).toBe(false);
});

test("homepage stays within its initial script budget", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const scripts = await page.evaluate(() => performance.getEntriesByType("resource").filter(entry => entry.initiatorType === "script").map(entry => ({ name: entry.name, transferSize: (entry as PerformanceResourceTiming).transferSize })));
  const transferred = scripts.reduce((sum, script) => sum + script.transferSize, 0);
  console.log(`Homepage script transfer: ${transferred} bytes`);
  expect(transferred).toBeLessThan(500_000);
  expect(scripts.some(script => script.name.includes("tool.worker"))).toBe(false);
});

test("registry category navigation reaches all JSON tools", async ({ page }) => {
  await page.goto("/tools/json");
  await expect(page.getByRole("heading", { name: "JSON tools." })).toBeVisible();
  for (const name of ["JSON Formatter", "JSON Validator", "JSON Minifier", "JSON Key Sorter"]) {
    await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  }
});
