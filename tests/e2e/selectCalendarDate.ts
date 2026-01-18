import type { Page } from "@playwright/test";

export const selectCalendarDate = async (page: Page, date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const isoDate = `${year}-${month}-${day}`;

  await page.waitForSelector('[role="gridcell"][data-day]');

  const cell = page
    .locator(`[role="gridcell"][data-day="${isoDate}"]`)
    .first();

  if (!(await cell.count())) {
    throw new Error(`Calendar day cell not found for ${isoDate}`);
  }

  await cell.getByRole("button").click();
};
