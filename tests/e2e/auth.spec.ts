import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

const requireCredentials = () => {
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    test.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.e2e.");
  }
};

const signIn = async (page: Page) => {
  const email = process.env.E2E_EMAIL ?? "";
  const password = process.env.E2E_PASSWORD ?? "";

  await page.goto("/auth");
  await page.getByRole("button", { name: "Sign in" }).first().click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.locator("form").getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Signed in as")).toBeVisible();
};

const getAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "http://127.0.0.1:54321";

  test.skip(!serviceKey, "Set SUPABASE_SERVICE_ROLE_KEY for local Supabase.");

  return createClient(supabaseUrl, serviceKey ?? "", {
    auth: { persistSession: false },
  });
};

const createSigninUser = async () => {
  const admin = getAdminClient();
  const password = process.env.E2E_PASSWORD ?? "Passw0rd!234";
  const email = `e2e-signin-${Date.now()}@example.com`;

  await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  return { email, password };
};

const buildSignupEmail = () => {
  const email = process.env.E2E_EMAIL ?? "";
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    test.skip(true, "E2E_EMAIL must be a valid email to derive signup email.");
  }

  return `${local}+signup-${Date.now()}@${domain}`;
};

test.describe("auth flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sign up shows success message", async ({ page }) => {
    requireCredentials();

    await page.goto("/auth");
    await page.getByRole("button", { name: "Create account" }).first().click();

    await page.getByLabel("Email").fill(buildSignupEmail());
    await page.getByLabel("Password").fill(process.env.E2E_PASSWORD ?? "");
    await page.getByLabel(/household name/i).fill("E2E Signup Household");
    await page
      .locator("form")
      .getByRole("button", { name: "Create account" })
      .click();
    const successMessage = page.getByText(/account created/i);
    const completionHeading = page.getByRole("heading", {
      name: /complete your profile/i,
    });

    await Promise.race([
      successMessage.waitFor({ state: "visible" }),
      completionHeading.waitFor({ state: "visible" }),
    ]);
  });

  test("sign in shows session and sign out clears it", async ({ page }) => {
    requireCredentials();

    const { email, password } = await createSigninUser();

    await page.goto("/auth");
    await page.getByRole("button", { name: "Sign in" }).first().click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.locator("form").getByRole("button", { name: "Sign in" }).click();

    const signedInLabel = page.getByText("Signed in as");
    const completionHeading = page.getByRole("heading", {
      name: /complete your profile/i,
    });

    await Promise.race([
      signedInLabel.waitFor({ state: "visible" }),
      completionHeading.waitFor({ state: "visible" }),
    ]);

    if (await completionHeading.isVisible()) {
      await page.getByLabel("Date of birth").fill("1980-01-01");
      await page.getByLabel("Gender").selectOption("female");
      await page.getByRole("button", { name: /save profile/i }).click();
    }

    await expect(signedInLabel).toBeVisible();

    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/auth");
    await expect(page.getByRole("button", { name: "Sign in" }).first()).toBeVisible();
  });

  test("invalid password shows error", async ({ page }) => {
    requireCredentials();

    await page.goto("/auth");
    await page.getByRole("button", { name: "Sign in" }).first().click();
    await page.getByLabel("Email").fill(process.env.E2E_EMAIL ?? "");
    await page.getByLabel("Password").fill("not-the-password");
    await page.locator("form").getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText(/invalid login credentials/i),
    ).toBeVisible();
  });
});
