import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

const envPath = fs.existsSync(".env.e2e") ? ".env.e2e" : ".env";
dotenv.config({ path: envPath });

const authFile = path.resolve(".playwright", ".auth", "owner.json");
const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

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
    channel: "chrome",
    storageState: authFile,
    launchOptions: {
      args: ["--disable-crashpad", "--disable-features=Crashpad"],
    },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
