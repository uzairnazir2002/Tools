import { expect, test } from "@playwright/test";

test("production security headers are present and the app still executes", async ({ page, request }) => {
  const response = await request.get("/json-formatter");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  await page.goto("/json-formatter");
  await page.locator(".editor-pane").first().locator(".cm-content").fill('{"ok":true}');
  await expect(page.locator(".output-pane .cm-content")).toContainText('"ok": true');
});

test("CodeMirror editors expose accessible textbox names", async ({ page }) => {
  await page.goto("/json-formatter");
  await expect(page.getByRole("textbox", { name: "Input JSON" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Formatted JSON" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Format JSON|Processing/ })).toBeVisible();
  await page.getByRole("textbox", { name: "Input JSON" }).fill("{bad,}");
  await expect(page.getByRole("status")).toBeVisible();
  await expect(page.locator(".diagnostic.error")).toContainText(/JSON|Unexpected|Expected/i);
});

test("legacy browser preferences migrate to Code Format Tools storage keys", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("formatbase.theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const values = await page.evaluate(() => ({
    next: localStorage.getItem("codeformattools.theme"),
    legacy: localStorage.getItem("formatbase.theme")
  }));
  expect(values).toEqual({ next: "dark", legacy: null });
});

for (const [path, sentinel] of [
  ["/json-formatter", "CODEFORMATTOOLS_PRIVATE_SENTINEL_JSON_12345"],
  ["/sql-formatter", "CODEFORMATTOOLS_PRIVATE_SENTINEL_SQL_12345"],
  ["/yaml-validator", "CODEFORMATTOOLS_PRIVATE_SENTINEL_YAML_12345"],
  ["/xml-validator", "CODEFORMATTOOLS_PRIVATE_SENTINEL_XML_12345"]
] as const) {
  test(`tool input is not transmitted for ${path}`, async ({ page }) => {
    const requests: string[] = [];
    page.on("request", request => requests.push(`${request.url()} ${request.postData() || ""}`));
    await page.goto(path);
    const input = page.locator(".editor-pane").first().locator(".cm-content");
    if (path.includes("sql")) await input.fill(`select '${sentinel}' as secret`);
    else if (path.includes("yaml")) await input.fill(`secret: ${sentinel}`);
    else if (path.includes("xml")) await input.fill(`<root>${sentinel}</root>`);
    else await input.fill(`{"secret":"${sentinel}"}`);
    await expect(page.getByRole("status")).not.toContainText("Ready when you are");
    expect(requests.some(request => request.includes(sentinel))).toBe(false);
  });
}

test("reduced motion preference disables active animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/json-formatter");
  await page.locator(".editor-pane").first().locator(".cm-content").fill('{"ok":true}');
  const duration = await page.locator(".status-dot").evaluate(element => getComputedStyle(element).animationDuration);
  const name = await page.locator(".status-dot").evaluate(element => getComputedStyle(element).animationName);
  expect(duration === "0.001ms" || duration === "0s" || name === "none").toBe(true);
});
