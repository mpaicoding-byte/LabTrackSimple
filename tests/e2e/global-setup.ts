import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { FullConfig } from "@playwright/test";

const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

const ensureCredentials = () => {
  if (!email || !password) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD in .env.e2e before running E2E tests.");
  }
};

const ensureAuthUser = async () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  if (!serviceKey || !supabaseUrl || !email || !password) {
    return;
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    return;
  }

  const existing = data.users.find((user) => user.email === email);

  if (!existing) {
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    return;
  }

  await admin.auth.admin.updateUserById(existing.id, {
    email_confirm: true,
    password,
  });
};

export default async function globalSetup(config: FullConfig) {
  ensureCredentials();
  await ensureAuthUser();

  if (
    process.platform === "darwin" &&
    os.cpus().length === 0 &&
    !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE
  ) {
    process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = "mac-arm64";
  }

  const { chromium, firefox, webkit } = await import("@playwright/test");

  const project = config.projects[0];
  const baseURL = project.use?.baseURL?.toString() ?? "http://127.0.0.1:3000";
  const storageStatePath =
    typeof project.use?.storageState === "string"
      ? project.use.storageState
      : path.resolve(".playwright", ".auth", "owner.json");
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

  const browserName = process.env.E2E_BROWSER ?? "chromium";
  const browserType =
    browserName === "firefox" ? firefox : browserName === "webkit" ? webkit : chromium;
  const useChromeChannel = process.env.PW_USE_CHROME === "true" && browserName === "chromium";
  const browser = await browserType.launch({
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
  const dashboardHeading = page.getByRole("heading", { name: /dashboard/i });
  const familyHeading = page.getByRole("heading", { name: /my family/i });
  const signedInLabel = page.getByText("Signed in as");

  const destination = await Promise.race([
    completionHeading.waitFor({ timeout: 30_000 }).then(() => "complete"),
    dashboardHeading.waitFor({ timeout: 30_000 }).then(() => "dashboard"),
    familyHeading.waitFor({ timeout: 30_000 }).then(() => "family"),
    signedInLabel.waitFor({ timeout: 30_000 }).then(() => "signed-in"),
  ]).catch(() => "unknown");

  if (destination === "complete") {
    await page.getByLabel("Date of birth").fill("1980-01-01");
    await page.getByLabel("Gender").selectOption("female");
    await page.getByRole("button", { name: /save profile/i }).click();
    await page.waitForURL("**/people");
  } else if (destination === "unknown") {
    const statusMessage = page.locator(
      'form div[class*="bg-red-500/10"], form div[class*="bg-emerald-500/10"]',
    );
    const statusText = (await statusMessage.first().textContent())?.trim();
    const suffix = statusText ? ` Status: ${statusText}` : "";
    throw new Error(
      `Auth flow did not reach a signed-in screen. URL: ${page.url()}.${suffix}`,
    );
  }

  await page.context().storageState({ path: storageStatePath });
  await browser.close();
}
