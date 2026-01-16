import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const requireCredentials = () => {
  if (!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD) {
    test.skip(true, "Set E2E_EMAIL and E2E_PASSWORD in .env.e2e.");
  }
};

const getAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "http://127.0.0.1:54321";

  test.skip(!serviceKey, "Set SUPABASE_SERVICE_ROLE_KEY for local Supabase.");

  return createClient(supabaseUrl, serviceKey ?? "", {
    auth: { persistSession: false },
  });
};

test.describe("manual report entry", () => {
  test("owner can create a manual report, add a result, and confirm", async ({ page }) => {
    requireCredentials();
    const admin = getAdminClient();

    await page.goto("/people");
    await page.getByRole("button", { name: /add family member/i }).click();

    const newName = `E2E Manual Person ${Date.now()}`;
    await page.getByPlaceholder("e.g. Grandma Mae").fill(newName);
    await page.locator("input[type=\"date\"]").fill("1990-01-01");
    await page.getByRole("combobox").selectOption("female");
    await page.getByRole("button", { name: /save person/i }).click();
    await expect(page.getByRole("heading", { name: new RegExp(newName, "i") })).toBeVisible();

    await page.goto("/reports");
    await page.getByRole("button", { name: /create manual report/i }).click();
    await page.getByRole("button", { name: new RegExp(newName, "i") }).click();
    await page.getByLabel(/report date/i).fill("2024-02-15");
    await page.getByRole("button", { name: /create report/i }).click();

    await page.waitForURL(/\/reports\/[^/]+\/review/);
    await expect(page.getByRole("heading", { name: /review results/i })).toBeVisible();

    const reportMatch = page.url().match(/\/reports\/([^/]+)\/review/);
    const reportId = reportMatch?.[1] ?? null;
    expect(reportId).toBeTruthy();

    await page.getByRole("button", { name: /add result/i }).click();
    await page.getByLabel(/^name$/i).fill("ManualTest");
    await page.getByLabel(/^value$/i).fill("123");
    await page.getByLabel(/^unit$/i).fill("mg/dL");

    await page.getByRole("button", { name: /confirm & save/i }).click();
    await expect(page.getByText(/report confirmed/i)).toBeVisible({ timeout: 30_000 });

    const { data: report } = await admin
      .from("lab_reports")
      .select("status, current_extraction_run_id, final_extraction_run_id")
      .eq("id", reportId ?? "")
      .maybeSingle();

    expect(report?.status).toBe("final");
    expect(report?.final_extraction_run_id).toBe(report?.current_extraction_run_id);

    const { data: results } = await admin
      .from("lab_results")
      .select("name_raw, is_active, is_final")
      .eq("lab_report_id", reportId ?? "");

    expect((results ?? []).some((row) => row.name_raw === "ManualTest")).toBeTruthy();
    expect((results ?? []).every((row) => row.is_active && row.is_final)).toBeTruthy();
  });
});

