import path from "node:path";
import { expect, test } from "@playwright/test";
import { selectCalendarDate } from "./selectCalendarDate";

const requireCredentials = () => {
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    test.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.");
  }
};

test.describe("report delete", () => {
  test("owner can soft delete a report", async ({ page }) => {
    requireCredentials();

    await page.goto("/people");

    const newName = `E2E Delete Person ${Date.now()}`;
    const dobDate = new Date();
    dobDate.setDate(1);
    await page.getByRole("button", { name: /add family member/i }).click();
    await page.getByLabel("Full Name").fill(newName);
    await page.getByLabel(/date of birth/i).click();
    await selectCalendarDate(page, dobDate);
    await page.getByLabel("Gender").click();
    await page.getByRole("option", { name: "Female" }).click();
    await page.getByRole("button", { name: /save person/i }).click();
    await expect(page.getByText(newName, { exact: true })).toBeVisible();

    await page.goto("/reports");

    const filePath = path.resolve("tests/assets/Report Mahesh 2025.pdf");
    await page.getByLabel(/report file/i).setInputFiles(filePath);
    await expect(
      page.getByRole("heading", { name: /new report from file/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: new RegExp(newName, "i") }).click();
    const reportDate = new Date();
    reportDate.setDate(15);
    await page.getByLabel(/report date/i).click();
    await selectCalendarDate(page, reportDate);
    await page.getByRole("button", { name: /save report/i }).click();

    await expect(page.getByRole("heading", { name: /lab reports/i })).toBeVisible();
    const reportCard = page
      .getByRole("heading", { name: new RegExp(newName, "i") })
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");
    await expect(reportCard).toBeVisible();

    const reviewLink = reportCard.getByRole("link", { name: /review|view/i });
    await expect(reviewLink).toBeVisible({ timeout: 30_000 });
    await reviewLink.click();

    await page.waitForURL(/\/reports\/[^/]+\/review/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /review results/i })).toBeVisible();

    await page.getByRole("button", { name: /delete report/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /delete report/i })).toBeVisible();
    await dialog.getByRole("button", { name: /delete report/i }).click();

    await page.waitForURL(/\/reports$/, { timeout: 30_000 });
    await expect(reportCard).toHaveCount(0);
  });
});
