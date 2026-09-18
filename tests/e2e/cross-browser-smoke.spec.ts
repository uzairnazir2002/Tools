import { expect, test } from "@playwright/test";

test("core formatter flow works across browsers", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Make sense of/ })).toBeVisible();
  await page.goto("/json-formatter");
  await page.getByRole("textbox", { name: "Input JSON" }).fill('{"id":9123372036854000123}');
  await expect(page.locator(".output-pane .cm-content")).toContainText("9123372036854000123");
  await page.goto("/json-validator");
  await page.getByRole("textbox", { name: "Input JSON" }).fill('{"ok":true}');
  await expect(page.getByText("Valid input")).toBeVisible();
  await page.goto("/sql-formatter");
  await page.getByRole("textbox", { name: "Input SQL" }).fill("select * from users");
  await expect(page.locator(".output-pane .cm-content")).toContainText("SELECT");
  await page.goto("/yaml-formatter");
  await expect(page.getByLabel("Indent").locator("option", { hasText: "Tab" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Input YAML" }).fill("service: {name: api}");
  await expect(page.locator(".output-pane .cm-content")).toContainText("name: api");
  await page.goto("/xml-formatter");
  await page.getByRole("textbox", { name: "Input XML" }).fill("<root><item>ok</item></root>");
  await expect(page.locator(".output-pane .cm-content")).toContainText("<item>ok</item>");
  await page.goto("/json-to-yaml");
  await page.getByRole("textbox", { name: "Input JSON" }).fill('{"service":"api"}');
  await expect(page.locator(".output-pane .cm-content")).toContainText("service");
  await expect(page.locator(".output-pane .cm-content")).toContainText("api");
});

test("mobile layout has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto("/json-formatter");
  await page.getByRole("textbox", { name: "Input JSON" }).fill('{"ok":true}');
  await expect(page.locator(".output-pane .cm-content")).toContainText('"ok": true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
