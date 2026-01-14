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

    await signIn(page);

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
