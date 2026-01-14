import fs from "node:fs";
import path from "node:path";
import { chromium, type FullConfig } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

const ensureCredentials = () => {
  if (!email || !password) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD in .env.e2e before running E2E tests.");
  }
};

export default async function globalSetup(config: FullConfig) {
  ensureCredentials();

  const project = config.projects[0];
  const baseURL = project.use?.baseURL?.toString() ?? "http://127.0.0.1:3000";
  const storageStatePath =
    typeof project.use?.storageState === "string"
      ? project.use.storageState
      : path.resolve(".playwright", ".auth", "owner.json");
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

  const useChromeChannel = process.env.PW_USE_CHROME === "true";
  const browser = await chromium.launch({
    ...(useChromeChannel ? { channel: "chrome" } : {}),
  });
  const page = await browser.newPage();

  await page.goto(`${baseURL}/auth`);
  await page.getByLabel("Email").fill(email ?? "");
  await page.getByLabel("Password").fill(password ?? "");
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();

  await page.waitForLoadState("networkidle");
  const completionHeading = page.getByRole("heading", {
    name: /complete your profile/i,
  });
  if (await completionHeading.isVisible()) {
    await page.getByLabel("Date of birth").fill("1980-01-01");
    await page.getByLabel("Gender").selectOption("female");
    await page.getByRole("button", { name: /save profile/i }).click();
    await page.waitForURL("**/people");
  } else {
    await page.getByText("Signed in as").waitFor();
  }

  await page.context().storageState({ path: storageStatePath });
  await browser.close();
}
