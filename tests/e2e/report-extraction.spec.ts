import path from "node:path";
import { expect, test } from "@playwright/test";
import { selectCalendarDate } from "./selectCalendarDate";

const requireCredentials = () => {
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    test.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.");
  }
};

test.describe("report extraction", () => {
  test("owner can trigger extraction for a report", async ({ page }) => {
    requireCredentials();

    await page.goto("/people");

    await page.getByRole("button", { name: /add family member/i }).click();

    const newName = `E2E Extraction Person ${Date.now()}`;
    const dobDate = new Date();
    dobDate.setDate(1);
    await page.getByPlaceholder("e.g. Grandma Mae").fill(newName);
    await page.getByLabel(/date of birth/i).click();
    await selectCalendarDate(page, dobDate);
    await page.getByLabel("Gender").click();
    await page.getByRole("option", { name: "Female" }).click();
    await page.getByRole("button", { name: /save person/i }).click();
    await expect(page.getByRole("heading", { name: new RegExp(newName, "i") })).toBeVisible();

    await page.goto("/reports");

    const filePath = path.resolve("tests/assets/Report Mahesh 2025.pdf");
    await page.getByLabel(/report file/i).setInputFiles(filePath);

    await page.getByRole("button", { name: new RegExp(newName, "i") }).click();
    const reportDate = new Date();
    reportDate.setDate(15);
    await page.getByLabel(/report date/i).click();
    await selectCalendarDate(page, reportDate);
    await page.getByRole("button", { name: /save report/i }).click();

    await expect(
      page.getByRole("heading", { name: /lab reports/i }),
    ).toBeVisible();

    const reportCard = page
      .getByRole("heading", { name: new RegExp(newName, "i") })
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");

    await expect(reportCard.getByText(/review required/i)).toBeVisible({
      timeout: 30_000,
    });
  });
});
