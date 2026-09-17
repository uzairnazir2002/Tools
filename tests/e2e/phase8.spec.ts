import { expect, test } from "@playwright/test";

test("observability scripts initialize without exposing tool input", async ({ page }) => {
  const sentinel = "PRIVATE_PHASE8_SENTINEL_19427";
  const requests: string[] = [];
  page.on("request", request => requests.push(`${request.url()} ${request.postData() || ""}`));
  await page.goto("/json-formatter");
  await expect.poll(() => page.evaluate(() => typeof window.va === "function" || Array.isArray(window.vaq))).toBe(true);
  await expect.poll(() => page.evaluate(() => typeof window.si === "function" || Array.isArray(window.siq))).toBe(true);
  await page.locator(".editor-pane").first().locator(".cm-content").fill(`{"secret":"${sentinel}","ok":true}`);
  await expect(page.locator(".output-pane .cm-content")).toContainText('"ok": true');
  expect(requests.some(request => request.includes(sentinel))).toBe(false);
});

test("related-tool clicks remain navigable and measurable", async ({ page }) => {
  await page.goto("/json-formatter");
  await page.locator(".related").getByRole("link", { name: /JSON Validator/ }).click();
  await expect(page).toHaveURL(/\/json-validator$/);
  await expect(page.getByRole("heading", { name: "JSON Validator." })).toBeVisible();
});
