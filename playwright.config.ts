import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3101",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} } },
    { name: "firefox-smoke", testMatch: /cross-browser-smoke\.spec\.ts/, use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-smoke", testMatch: /cross-browser-smoke\.spec\.ts/, use: { ...devices["Desktop Safari"] } }
  ],
  webServer: {
    command: "pnpm --filter web exec next start -p 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
