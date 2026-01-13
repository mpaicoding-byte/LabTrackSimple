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
    await page.getByPlaceholder("Full name").fill(newName);
    await page.getByLabel("Date of birth").fill("1990-01-01");
    await page.getByLabel("Gender").selectOption("female");
    await page.getByRole("button", { name: /add person/i }).click();
    await expect(page.getByText(/person created/i)).toBeVisible();

    await page.goto("/reports");

    await page.getByLabel("Person").selectOption({ index: 1 });
    await page.getByLabel("Report date").fill("2024-02-15");
    await page.getByLabel("Source").fill("Quest Diagnostics");
    await page.getByLabel("Notes").fill("E2E upload test");
    await page.getByRole("button", { name: /create report/i }).click();

    await expect(page.getByText(/report created/i)).toBeVisible();

    await page.locator("#report-select").selectOption({ index: 1 });

    const filePath = path.resolve("tests/assets/Report Mahesh 2025.pdf");
    await page.getByLabel("Artifact file").setInputFiles(filePath);
    await page.getByRole("button", { name: /upload artifact/i }).click();

    await expect(page.getByText(/ready/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /view/i })).toBeVisible();
  });
});
