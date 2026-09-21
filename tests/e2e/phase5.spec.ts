import { test, expect } from "@playwright/test";

test("JSON to YAML and YAML to JSON work with exact large integers", async ({ page }) => {
  await page.goto("/json-to-yaml");
  await expect(page).toHaveTitle(/JSON to YAML/);
  await page.locator(".editor-pane").first().locator(".cm-content").fill('{"big":9123372036854000123,"name":"api"}');
  await expect(page.locator(".output-pane .cm-content")).toContainText("9123372036854000123");
  await page.goto("/yaml-to-json");
  await page.locator(".editor-pane").first().locator(".cm-content").fill("big: 9123372036854000123\nname: api");
  await expect(page.locator(".output-pane .cm-content")).toContainText('"big": 9123372036854000123');
});

test("YAML alias conversion requires a mode decision", async ({ page }) => {
  await page.goto("/yaml-to-json");
  await page.locator(".editor-pane").first().locator(".cm-content").fill("base: &base {a: 1}\ncopy: *base");
  await expect(page.locator(".diagnostic.error")).toContainText(/aliases cannot be represented/);
  await page.getByLabel("Mode").selectOption("best-effort");
  await expect(page.locator(".output-pane .cm-content")).toContainText('"copy"');
  await expect(page.locator(".diagnostic.warning")).toContainText(/materialized/);
});

test("XML converters expose best effort mapping and lossless envelope", async ({ page }) => {
  await page.goto("/xml-to-json");
  await page.locator(".editor-pane").first().locator(".cm-content").fill('<root><item id="1">Book</item></root>');
  await expect(page.locator(".output-pane .cm-content")).toContainText('"@id": "1"', { timeout: 15_000 });
  await page.getByLabel("Mode").selectOption("lossless");
  await expect(page.locator(".output-pane .cm-content")).toContainText("codeformattertools.xml.v1");
  await page.goto("/json-to-xml");
  await page.locator(".editor-pane").first().locator(".cm-content").fill('{"root":{"item":{"@id":"1","#text":"Book"}}}');
  await expect(page.locator(".output-pane .cm-content")).toContainText('<item id="1">Book</item>');
});

test("CSV converters show type loss, inference, and safe formula escaping", async ({ page }) => {
  await page.goto("/json-to-csv");
  await page.locator(".editor-pane").first().locator(".cm-content").fill('[{"name":"=2+2","age":30}]');
  await expect(page.locator(".output-pane .cm-content")).toContainText("'=2+2");
  await expect(page.locator(".diagnostic.warning").filter({ hasText: /formula-like/ })).toBeVisible();
  await page.goto("/csv-to-json");
  await page.locator(".editor-pane").first().locator(".cm-content").fill("name,age\nAisha,30");
  await expect(page.locator(".output-pane .cm-content")).toContainText('"age": "30"');
  await page.getByLabel("Mode").selectOption("best-effort");
  await expect(page.locator(".output-pane .cm-content")).toContainText('"age": 30');
});

test("CSV category, file download, and mobile layout work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/csv");
  await expect(page.getByRole("link", { name: /CSV to JSON/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /JSON to CSV/ })).toBeVisible();
  await page.goto("/csv-to-json");
  await page.locator('input[type="file"]').setInputFiles({ name: "sample.csv", mimeType: "text/csv", buffer: Buffer.from("name\nAisha") });
  await expect(page.locator(".output-pane .cm-content")).toContainText("Aisha");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  expect((await download).suggestedFilename()).toBe("csv-to-json.json");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("conversion input stays out of outgoing requests", async ({ page }) => {
  const sentinel = "PRIVATE_CONVERSION_SENTINEL_62738";
  const requests: string[] = [];
  page.on("request", request => requests.push(`${request.url()} ${request.postData() || ""}`));
  await page.goto("/json-to-yaml");
  await page.locator(".editor-pane").first().locator(".cm-content").fill(`{"secret":"${sentinel}"}`);
  await expect(page.locator(".output-pane .cm-content")).toContainText(sentinel);
  expect(requests.some(request => request.includes(sentinel))).toBe(false);
});
