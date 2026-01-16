import path from "node:path";
import crypto from "node:crypto";
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

const findUserByEmail = async (
  admin: ReturnType<typeof getAdminClient>,
  email: string,
) => {
  let page = 1;
  let lastPage = 1;

  while (page && page <= lastPage) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) throw error;

    const user = data?.users?.find((candidate) => candidate.email === email);
    if (user) return user;

    lastPage = data?.lastPage ?? lastPage;
    page = data?.nextPage ?? (page < lastPage ? page + 1 : 0);
  }

  return null;
};

test.describe("report review + confirm", () => {
  test("owner can review and confirm extracted results", async ({ page }) => {
    requireCredentials();
    const admin = getAdminClient();

    await page.goto("/people");
    await page.getByRole("button", { name: /add family member/i }).click();

    const newName = `E2E Review Person ${Date.now()}`;
    await page.getByPlaceholder("e.g. Grandma Mae").fill(newName);
    await page.locator("input[type=\"date\"]").fill("1990-01-01");
    await page.getByRole("combobox").selectOption("female");
    await page.getByRole("button", { name: /save person/i }).click();
    await expect(page.getByRole("heading", { name: new RegExp(newName, "i") })).toBeVisible();

    await page.goto("/reports");

    const filePath = path.resolve("tests/assets/Report Mahesh 2025.pdf");
    await page.getByLabel(/report file/i).setInputFiles(filePath);
    await page.getByRole("button", { name: new RegExp(newName, "i") }).click();
    await page.getByLabel(/report date/i).fill("2024-02-15");
    await page.getByRole("button", { name: /save report/i }).click();

    const reportCard = page
      .getByRole("heading", { name: new RegExp(newName, "i") })
      .first()
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");

    const { data: person } = await admin
      .from("people")
      .select("id")
      .eq("name", newName)
      .maybeSingle();

    const preRunId = crypto.randomUUID();
    let report: {
      id: string;
      person_id: string;
      status: string;
      current_extraction_run_id: string | null;
    } | null = null;

    await expect.poll(
      async () => {
      const { data } = await admin
        .from("lab_reports")
        .select("id, person_id, status, current_extraction_run_id")
        .eq("person_id", person?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      report = data ?? null;
      return data?.status ?? null;
      },
      { timeout: 30_000 },
    ).toBe("review_required");

    await expect.poll(
      async () => {
      const { data } = await admin
        .from("lab_reports")
        .select("id, person_id, status, current_extraction_run_id")
        .eq("person_id", person?.id ?? "")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      report = data ?? null;
      return data?.current_extraction_run_id ?? null;
      },
      { timeout: 30_000 },
    ).not.toBeNull();

    const { error: preexistingError } = await admin.from("lab_results").insert({
      lab_report_id: report?.id,
      person_id: report?.person_id,
      extraction_run_id: preRunId,
      name_raw: "Preexisting",
      value_raw: "1",
      unit_raw: "mg/dL",
      value_num: 1,
      details_raw: null,
      is_active: true,
      is_final: true,
    });
    expect(preexistingError).toBeNull();

    await expect.poll(
      async () => {
      const { data } = await admin
        .from("lab_results")
        .select("id")
        .eq("extraction_run_id", report?.current_extraction_run_id ?? "")
        .limit(1);
      return data?.length ?? 0;
      },
      { timeout: 30_000 },
    ).toBeGreaterThan(0);

    await page.reload();
    const refreshedCard = page
      .getByRole("heading", { name: new RegExp(newName, "i") })
      .first()
      .locator("xpath=ancestor::div[contains(@class,'group')][1]");
    await expect(refreshedCard.getByText(/needs confirmation/i)).toBeVisible();

    const { data: beforeCommit } = await admin
      .from("lab_results")
      .select("id, is_active")
      .eq("lab_report_id", report?.id ?? "")
      .eq("extraction_run_id", preRunId)
      .maybeSingle();

    expect(beforeCommit?.is_active).toBe(true);

    await refreshedCard.getByRole("link", { name: /review/i }).click();

    await page.waitForURL(/\/reports\/[^/]+\/review/, { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /review results/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 30_000 });

    const confirmButton = page.getByRole("button", { name: /confirm & save/i });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(page.getByText(/report confirmed/i)).toBeVisible({ timeout: 30_000 });

    const { data: afterConfirm } = await admin
      .from("lab_results")
      .select("id, name_raw, is_active, is_final, extraction_run_id")
      .eq("lab_report_id", report?.id ?? "");

    const previousRunRows = (afterConfirm ?? []).filter(
      (row) => row.extraction_run_id === preRunId,
    );
    const currentRunRows = (afterConfirm ?? []).filter(
      (row) => row.extraction_run_id === report?.current_extraction_run_id,
    );

    expect(previousRunRows.every((row) => row.is_active === false)).toBeTruthy();
    expect(currentRunRows.length).toBeGreaterThan(0);
    expect(currentRunRows.every((row) => row.is_active && row.is_final)).toBeTruthy();

    const { data: finalReport } = await admin
      .from("lab_reports")
      .select("status, final_extraction_run_id")
      .eq("id", report?.id ?? "")
      .maybeSingle();

    expect(finalReport?.status).toBe("final");
    expect(finalReport?.final_extraction_run_id).toBe(report?.current_extraction_run_id ?? "");

    const { data: finalRun } = await admin
      .from("extraction_runs")
      .select("status")
      .eq("id", report?.current_extraction_run_id ?? "")
      .maybeSingle();
    expect(finalRun?.status).toBe("confirmed");
  });

  test("member cannot approve or commit results", async ({ page }) => {
    const admin = getAdminClient();
    const memberEmail = `member-${Date.now()}@example.com`;
    const memberPassword = "Passw0rd!234";

    const ownerEmail = process.env.E2E_EMAIL ?? "";
    const ownerUser = await findUserByEmail(admin, ownerEmail);
    expect(ownerUser).toBeTruthy();

    const { data: ownerMembership } = await admin
      .from("household_members")
      .select("household_id")
      .eq("user_id", ownerUser?.id ?? "")
      .eq("role", "owner")
      .maybeSingle();

    const { data: memberUser } = await admin.auth.admin.createUser({
      email: memberEmail,
      password: memberPassword,
      email_confirm: true,
    });

    const { data: person } = await admin
      .from("people")
      .insert({
        household_id: ownerMembership?.household_id,
        user_id: memberUser?.user?.id,
        name: "Member Person",
      })
      .select("id")
      .maybeSingle();

    await admin.from("household_members").insert({
      household_id: ownerMembership?.household_id,
      user_id: memberUser?.user?.id,
      role: "member",
    });

    const runId = crypto.randomUUID();
    const { data: report } = await admin
      .from("lab_reports")
      .insert({
        household_id: ownerMembership?.household_id,
        person_id: person?.id,
        report_date: "2024-03-01",
        source: "Seeded",
        status: "review_required",
      })
      .select("id")
      .maybeSingle();

    await admin.from("extraction_runs").insert({
      id: runId,
      lab_report_id: report?.id,
      status: "ready",
      created_by: ownerUser?.id,
    });

    await admin
      .from("lab_reports")
      .update({ current_extraction_run_id: runId })
      .eq("id", report?.id ?? "");

    await admin.from("lab_results").insert({
      lab_report_id: report?.id,
      person_id: person?.id,
      extraction_run_id: runId,
      name_raw: "Calcium",
      value_raw: "9.2",
      unit_raw: "mg/dL",
      value_num: 9.2,
      details_raw: null,
      is_active: true,
    });

    await page.context().clearCookies();
    await page.goto("/auth");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByLabel("Email").fill(memberEmail);
    await page.getByLabel("Password").fill(memberPassword);
    await page.locator("form").getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((url) => !url.pathname.endsWith("/auth"));
    await expect(page.getByText(/signed in as/i)).toBeVisible();

    await page.goto(`/reports/${report?.id}/review`);

    await expect(page.getByRole("heading", { name: /review results/i })).toBeVisible();
    await expect(page.getByText(/calcium/i)).toBeVisible();

    await expect(page.getByRole("button", { name: /confirm & save/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /not correct/i })).toBeDisabled();
  });

  test("owner can mark extraction as not correct", async ({ page }) => {
    requireCredentials();
    const admin = getAdminClient();

    const ownerEmail = process.env.E2E_EMAIL ?? "";
    const ownerUser = await findUserByEmail(admin, ownerEmail);
    expect(ownerUser).toBeTruthy();

    const { data: ownerMembership } = await admin
      .from("household_members")
      .select("household_id")
      .eq("user_id", ownerUser?.id ?? "")
      .eq("role", "owner")
      .maybeSingle();

    const { data: person } = await admin
      .from("people")
      .insert({
        household_id: ownerMembership?.household_id,
        name: `Not Correct Person ${Date.now()}`,
      })
      .select("id")
      .maybeSingle();

    const runId = crypto.randomUUID();
    const { data: report } = await admin
      .from("lab_reports")
      .insert({
        household_id: ownerMembership?.household_id,
        person_id: person?.id,
        report_date: "2024-04-01",
        source: "Seeded",
        status: "review_required",
      })
      .select("id")
      .maybeSingle();

    await admin.from("extraction_runs").insert({
      id: runId,
      lab_report_id: report?.id,
      status: "ready",
      created_by: ownerUser?.id,
    });

    await admin
      .from("lab_reports")
      .update({ current_extraction_run_id: runId })
      .eq("id", report?.id ?? "");

    await admin.from("lab_results").insert({
      lab_report_id: report?.id,
      person_id: person?.id,
      extraction_run_id: runId,
      name_raw: "Sodium",
      value_raw: "140",
      unit_raw: "mmol/L",
      value_num: 140,
      details_raw: null,
      is_active: true,
    });

    await page.goto(`/reports/${report?.id}/review`);
    await expect(page.getByRole("heading", { name: /review results/i })).toBeVisible();
    await expect(page.getByText(/sodium/i)).toBeVisible();

    const notCorrectButton = page.getByRole("button", { name: /not correct/i });
    await expect(notCorrectButton).toBeEnabled();
    await notCorrectButton.click();

    await expect(page.getByText(/marked as not correct/i)).toBeVisible();

    const { data: updatedRun } = await admin
      .from("extraction_runs")
      .select("status")
      .eq("id", runId)
      .maybeSingle();
    expect(updatedRun?.status).toBe("rejected");

    const { data: updatedReport } = await admin
      .from("lab_reports")
      .select("status")
      .eq("id", report?.id ?? "")
      .maybeSingle();
    expect(updatedReport?.status).toBe("review_required");
  });
});
