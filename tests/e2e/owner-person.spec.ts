import { expect, test } from "@playwright/test";

test.describe("owner person flow", () => {
  test("people page shows date-of-birth input", async ({ page }) => {
    await page.goto("/people");
    await expect(
      page.getByRole("heading", { name: "Create a new person" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Full name")).toBeEnabled();
    await expect(page.getByLabel("Date of birth")).toBeVisible();
    await expect(page.getByLabel("Gender")).toBeVisible();
  });

  test("date of birth persists on the person card after reload", async ({
    page,
  }) => {
    const name = `E2E DOB ${Date.now()}`;
    const dob = "1990-01-01";

    await page.goto("/people");
    await page.getByPlaceholder("Full name").fill(name);
    const dobInput = page.getByLabel("Date of birth").first();
    await dobInput.fill(dob);
    await expect(dobInput).toHaveValue(dob);
    await page.getByLabel("Gender").selectOption("female");
    await page.getByRole("button", { name: "Add person" }).click();
    await expect(page.getByText("Person created.")).toBeVisible();

    await page.reload();
    const card = page
      .getByText(name, { exact: true })
      .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
    await expect(card).toBeVisible();
    await expect(card.getByText(/Born /).first()).toBeVisible();
  });
});
