import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const authFile = path.resolve(".playwright", ".auth", "owner.json");
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const useChromeChannel = process.env.PW_USE_CHROME === "true";
const e2eBrowser = process.env.E2E_BROWSER ?? "chromium";

const projectByBrowser = {
  chromium: {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
  firefox: {
    name: "firefox",
    use: { ...devices["Desktop Firefox"] },
  },
  webkit: {
    name: "webkit",
    use: { ...devices["Desktop Safari"] },
  },
} as const;

const projects =
  e2eBrowser === "all"
    ? Object.values(projectByBrowser)
    : [projectByBrowser[e2eBrowser as keyof typeof projectByBrowser] ?? projectByBrowser.chromium];

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalSetup: path.resolve("tests/e2e/global-setup.ts"),
  use: {
    baseURL,
    trace: "on-first-retry",
    storageState: authFile,
    ...(useChromeChannel ? { channel: "chrome" } : {}),
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects,
});
