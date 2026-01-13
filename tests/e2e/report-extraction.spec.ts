import path from "node:path";
import { expect, test } from "@playwright/test";

const requireCredentials = () => {
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    test.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.e2e.");
  }
};

test.describe("report extraction", () => {
  test("owner can trigger extraction for a report", async ({ page }) => {
    requireCredentials();

    await page.goto("/people");

    const newName = `E2E Extraction Person ${Date.now()}`;
    await page.getByPlaceholder("Full name").fill(newName);
    await page.getByLabel("Date of birth").fill("1990-01-01");
    await page.getByLabel("Gender").selectOption("female");
    await page.getByRole("button", { name: /add person/i }).click();
    await expect(page.getByText(/person created/i)).toBeVisible();

    await page.goto("/reports");

    const filePath = path.resolve("tests/assets/Report Mahesh 2025.pdf");
    await page.getByLabel(/report file/i).setInputFiles(filePath);

    await page.getByRole("button", { name: new RegExp(newName, "i") }).click();
    await page.getByLabel(/report date/i).fill("2024-02-15");
    await page.getByRole("button", { name: /save report/i }).click();

    await expect(page.getByText(/lab reports/i)).toBeVisible();

    const extractButton = page.getByRole("button", { name: /extract/i }).first();
    await extractButton.click();

    await expect(page.getByText(/review required/i)).toBeVisible();
  });
});
