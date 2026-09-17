import { test, expect } from "@playwright/test";

test("trailing comma shows context and can be fixed", async ({ page }) => {
  await page.goto("/json-validator");
  await page.locator(".editor-pane").first().locator(".cm-content").fill('{"a":1,}');
  await expect(page.getByText("Unexpected trailing comma")).toBeVisible();
  await expect(page.locator(".diagnostic-excerpt")).toContainText('^');
  await page.getByRole("button", { name: "Remove trailing comma" }).click();
  await expect(page.getByText("Valid input")).toBeVisible();
  await expect(page.getByText("Unexpected trailing comma")).toHaveCount(0);
});

test("file, indentation, copy, download, and reset work end to end", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/json-formatter");
  await page.locator('input[type="file"]').setInputFiles({ name: "sample.json", mimeType: "application/json", buffer: Buffer.from('{"a":1,"b":[2,3]}') });
  await page.getByLabel("Indent").selectOption("4");
  await expect(page.locator(".output-pane .cm-content")).toContainText('"a": 1');
  await page.getByRole("button", { name: "Copy" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('"a": 1');
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  expect((await download).suggestedFilename()).toBe("json-formatter.json");
  await page.getByRole("button", { name: /Reset/ }).click();
  await expect(page.locator(".output-pane .cm-content")).toBeEmpty();
});

test("large file enters guarded mode and can be run manually", async ({ page }) => {
  await page.goto("/json-validator");
  const large = `{"data":"${"a".repeat(1_100_000)}"}`;
  await page.locator('input[type="file"]').setInputFiles({ name: "large.json", mimeType: "application/json", buffer: Buffer.from(large) });
  await expect(page.getByText("Large input — run manually")).toBeVisible();
  await page.getByRole("button", { name: "Validate JSON" }).click();
  await expect(page.getByText("Valid input")).toBeVisible({ timeout: 20_000 });
});

test("key sorter preserves array order on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/json-sorter");
  await page.locator(".editor-pane").first().locator(".cm-content").fill('{"z":[2,1],"a":0}');
  await expect(page.locator(".output-pane .cm-content")).toContainText('"a": 0');
  const result = await page.locator(".output-pane .cm-content").innerText();
  expect(result.indexOf('"a": 0')).toBeLessThan(result.indexOf('"z"'));
  expect(result.indexOf("2")).toBeLessThan(result.indexOf("1"));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test("indentation preference and keyboard execution persist", async ({ page }) => {
  await page.goto("/json-formatter");
  await page.getByLabel("Indent").selectOption("4");
  await page.reload();
  await expect(page.getByLabel("Indent")).toHaveValue("4");
  const input = page.locator(".editor-pane").first().locator(".cm-content");
  await input.fill('{"a":1}');
  await input.press("Control+Enter");
  await expect(page.locator(".output-pane .cm-content")).toContainText('"a": 1');
  await expect(page.locator(".output-pane .cm-line").nth(1)).toHaveText('    "a": 1');
  await page.getByLabel("Indent").selectOption("2");
  await expect(page.locator(".output-pane .cm-line").nth(1)).toHaveText('  "a": 1');
});

test("extreme formatting expansion is stopped before output allocation", async ({ page }) => {
  await page.goto("/json-formatter");
  const chain = `${"[".repeat(511)}0${"]".repeat(511)}`;
  await page.locator(".editor-pane").first().locator(".cm-content").fill(`[${Array(30).fill(chain).join(",")}]`);
  await expect(page.getByText(/formatted result would exceed/)).toBeVisible();
});

test("oversized file is rejected before it is read", async ({ page }) => {
  await page.goto("/json-validator");
  await page.locator('input[type="file"]').setInputFiles({ name: "too-large.json", mimeType: "application/json", buffer: Buffer.alloc(3 * 1024 * 1024 + 1, 97) });
  await expect(page.getByText("Choose a file smaller than 3 MB.")).toBeVisible();
  await expect(page.locator(".editor-pane").first().locator(".cm-content")).toBeEmpty();
});
