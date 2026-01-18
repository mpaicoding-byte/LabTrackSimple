import { expect, test } from "@playwright/test";
import { selectCalendarDate } from "./selectCalendarDate";

const requireCredentials = () => {
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    test.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.");
  }
};

const buildSignupEmail = () => {
  const email = process.env.E2E_EMAIL ?? "";
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    test.skip(true, "E2E_EMAIL must be a valid email to derive signup email.");
  }

  return `${local}+onboarding-${Date.now()}@${domain}`;
};

test.describe("profile completion gate", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("new owner completes DOB and gender before entering the app", async ({ page }) => {
    requireCredentials();

    const signupEmail = buildSignupEmail();
    const password = process.env.E2E_PASSWORD ?? "";

    await page.goto("/auth");
    await page.getByRole("button", { name: "Create account" }).first().click();
    await page.getByLabel("Email").fill(signupEmail);
    await page.getByLabel("Password").fill(password);
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

    if (!(await completionHeading.isVisible())) {
      await page.goto("/auth");
      const signInToggle = page.getByRole("button", { name: "Sign in" }).first();
      if (await signInToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signInToggle.click();
        await page.getByLabel("Email").fill(signupEmail);
        await page.getByLabel("Password").fill(password);
        await page.locator("form").getByRole("button", { name: "Sign in" }).click();
      }
    }

    await page.waitForURL("**/onboarding/profile");
    await expect(
      page.getByRole("heading", { name: /complete your profile/i }),
    ).toBeVisible();

    const saveButton = page.getByRole("button", { name: /save profile/i });
    await saveButton.click();
    await expect(page.getByText("Date of birth is required.")).toBeVisible();
    await expect(page.getByText("Gender is required.")).toBeVisible();

    const dobDate = new Date();
    dobDate.setDate(1);
    await page.getByLabel("Date of birth").click();
    await selectCalendarDate(page, dobDate);
    await page.getByLabel("Gender").click();
    await page.getByRole("option", { name: "Female" }).click();
    await saveButton.click();

    await page.waitForURL("**/people");
    await expect(
      page.getByRole("heading", { name: /my family/i }),
    ).toBeVisible();
  });
});
