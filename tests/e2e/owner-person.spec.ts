import { expect, test } from "@playwright/test";

test.describe("owner person flow", () => {
  test("people page shows date-of-birth input", async ({ page }) => {
    await page.goto("/people");
    await page.getByRole("button", { name: /add family member/i }).click();
    await expect(
      page.getByRole("heading", { name: /add family member/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeEnabled();
    await expect(page.getByLabel(/date of birth/i)).toBeVisible();
    await expect(page.getByLabel("Gender")).toBeVisible();
  });

  test("date of birth persists on the person card after reload", async ({
    page,
  }) => {
    const name = `E2E DOB ${Date.now()}`;
    const dob = "1990-01-01";

    await page.goto("/people");
    await page.getByRole("button", { name: /add family member/i }).click();
    await page.getByLabel("Full Name").fill(name);
    const dobInput = page.getByLabel(/date of birth/i).first();
    await dobInput.fill(dob);
    await expect(dobInput).toHaveValue(dob);
    await page.getByLabel("Gender").selectOption("female");
    await page.getByRole("button", { name: /save person/i }).click();
    await expect(page.getByRole("heading", { name: /my family/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: /my family/i })).toBeVisible();
    const card = page
      .getByText(name, { exact: true })
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");
    await expect(card).toBeVisible();
    await expect(card.getByText(/1990/)).toBeVisible();
  });
});
