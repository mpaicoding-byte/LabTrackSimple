import path from "node:path";
import { expect, test } from "@playwright/test";

const requireCredentials = () => {
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    test.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.e2e.");
  }
};

test.describe("reports and artifacts", () => {
  test("owner can create a report and upload an artifact", async ({ page }) => {
    requireCredentials();

    await page.goto("/people");

    const newName = `E2E Report Person ${Date.now()}`;
    await page.getByRole("button", { name: /add family member/i }).click();
    await page.getByLabel("Full Name").fill(newName);
    await page.getByLabel(/date of birth/i).fill("1990-01-01");
    await page.getByLabel("Gender").selectOption("female");
    await page.getByRole("button", { name: /save person/i }).click();
    await expect(page.getByText(newName, { exact: true })).toBeVisible();

    await page.goto("/reports");

    const filePath = path.resolve("tests/assets/Report Mahesh 2025.pdf");
    await page.getByLabel(/report file/i).setInputFiles(filePath);
    await expect(
      page.getByRole("heading", { name: /new report from file/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: new RegExp(newName, "i") }).click();
    await page.getByLabel(/report date/i).fill("2024-02-15");
    await page.getByRole("button", { name: /save report/i }).click();

    await expect(page.getByRole("heading", { name: /lab reports/i })).toBeVisible();
    const reportCard = page
      .getByRole("heading", { name: new RegExp(newName, "i") })
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");
    await expect(reportCard).toBeVisible();
    await expect(reportCard.getByText(/draft/i)).toBeVisible();
  });
});
