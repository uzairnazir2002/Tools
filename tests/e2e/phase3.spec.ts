import { test, expect } from "@playwright/test";

test("YAML formatter handles anchors, comments, and indentation", async ({ page }) => {
  await page.goto("/yaml-formatter");
  await expect(page).toHaveTitle(/YAML Formatter/);
  await page.getByLabel("Indent").selectOption("4");
  await page.locator(".editor-pane").first().locator(".cm-content").fill("base: &base {a: 1}\ncopy: *base # note\n");
  await expect(page.locator(".output-pane .cm-content")).toContainText("&base");
  await expect(page.locator(".output-pane .cm-content")).toContainText("*base");
  await expect(page.locator(".output-pane .cm-line").nth(1)).toHaveText("    a: 1");
  await expect(page.locator(".diagnostic.warning")).toContainText(/Comments may be removed/);
});

test("YAML validator reports syntax and rejects recursive aliases", async ({ page }) => {
  await page.goto("/yaml-validator");
  const input = page.locator(".editor-pane").first().locator(".cm-content");
  await input.fill("name: [oops");
  await expect(page.locator(".diagnostic.error")).toContainText(/line 1, column/);
  await input.fill("loop: &loop\n  self: *loop");
  await expect(page.locator(".diagnostic.error")).toContainText(/node safety limit/);
  await input.fill("name: api");
  await expect(page.getByText("Valid input")).toBeVisible();
});

test("YAML category, file action, and mobile layout work", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/yaml");
  await expect(page.getByRole("link", { name: /YAML Formatter/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /YAML Validator/ })).toBeVisible();
  await page.goto("/yaml-formatter");
  await page.locator('input[type="file"]').setInputFiles({ name: "config.yml", mimeType: "text/plain", buffer: Buffer.from("service: {name: api}") });
  await expect(page.locator(".output-pane .cm-content")).toContainText("name: api");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("YAML source is absent from outgoing requests", async ({ page }) => {
  const sentinel = "PRIVATE_YAML_SENTINEL_31683";
  const requests: string[] = [];
  page.on("request", request => requests.push(`${request.url()} ${request.postData() || ""}`));
  await page.goto("/yaml-validator");
  await page.locator(".editor-pane").first().locator(".cm-content").fill(`secret: ${sentinel}`);
  await expect(page.getByText("Valid input")).toBeVisible();
  expect(requests.some(request => request.includes(sentinel))).toBe(false);
});
